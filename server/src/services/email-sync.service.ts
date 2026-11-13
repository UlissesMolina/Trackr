// Gmail → application status sync.
//
// Each run: search the inbox for mail that might be about an application,
// skip messages already seen, classify the rest with the model, match each
// one to an existing application, and apply the change. Every message gets an
// EmailSyncEvent row so it's never processed twice and the user can audit
// what happened.

import { AuthenticationError, RateLimitError } from "openai";
import prisma from "../lib/prisma";
import { decrypt } from "../lib/crypto";
import { ApplicationStatus, EmailSyncAction } from "../../generated/prisma/enums";
import { companiesMatch, normalizeCompany, normalizeForDedup } from "../lib/dedup";
import {
  candidateQuery,
  getMessages,
  listMessageIds,
  refreshAccessToken,
  type GmailMessage,
} from "./gmail.service";
import { classifyEmails, type Classification } from "./email-classifier.service";
import { createApplication, updateApplicationStatus } from "./application.service";
import { upsertOA } from "./oa.service";

const INITIAL_LOOKBACK_DAYS = 30;
const OVERLAP_MS = 24 * 60 * 60 * 1000; // re-scan a day back so late-arriving mail isn't missed
const MAX_MESSAGES_PER_SYNC = 200;

export interface SyncSummary {
  scanned: number;
  created: number;
  updated: number;
  oaAdded: number;
  unmatched: number;
  ignored: number;
}

export class SyncInProgressError extends Error {
  constructor() {
    super("A sync is already running");
  }
}

const running = new Set<string>();

export function isSyncRunning(clerkUserId: string): boolean {
  return running.has(clerkUserId);
}

/** Turn a sync failure into something the Settings card can show. */
function describeError(err: unknown): string {
  if (err instanceof AuthenticationError) {
    return "The server's OpenAI API key is missing or invalid, so emails couldn't be classified. Set OPENAI_API_KEY on the server and sync again.";
  }
  if (err instanceof RateLimitError) {
    return "OpenAI rate limit or quota reached. Check the account's billing, then sync again.";
  }
  const status = (err as { status?: number })?.status;
  if (status === 401 || status === 403) {
    return "Gmail refused the request. Try disconnecting and reconnecting Gmail.";
  }
  return ((err as Error)?.message || "Sync failed").slice(0, 300);
}

type AppRow = {
  id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  createdAt: Date;
  onlineAssessment: { id: string } | null;
};

const RANK: Record<ApplicationStatus, number> = {
  SAVED: 0,
  APPLIED: 1,
  UNDER_REVIEW: 1,
  INTERVIEW: 2,
  OFFER: 3,
  REJECTED: 4,
};

/* ── Matching ──────────────────────────────────────────────────────────── */

function pickMostRelevant(apps: AppRow[]): AppRow {
  // Prefer something still in play, then the most recent.
  return [...apps].sort((a, b) => {
    const aOpen = a.status === "REJECTED" ? 1 : 0;
    const bOpen = b.status === "REJECTED" ? 1 : 0;
    return aOpen - bOpen || b.createdAt.getTime() - a.createdAt.getTime();
  })[0];
}

type Match = { app: AppRow } | { app: null; reason: string | null };

function findMatch(apps: AppRow[], company: string | null, title: string | null, strict: boolean): Match {
  if (!company) return { app: null, reason: "No company in email" };
  const c = normalizeCompany(company);
  const candidates = apps.filter((a) => companiesMatch(normalizeCompany(a.company), c));
  if (candidates.length === 0) return { app: null, reason: null };
  if (candidates.length === 1) return { app: candidates[0] };

  if (title) {
    const keys = new Set(normalizeForDedup(company, title));
    const byTitle = candidates.filter((a) => normalizeForDedup(a.company, a.title).some((k) => keys.has(k)));
    if (byTitle.length > 0) return { app: pickMostRelevant(byTitle) };
    // Several roles at this company and the email names one we don't track:
    // guessing could update the wrong application.
    return { app: null, reason: `${candidates.length} applications at ${company}, none titled "${title}"` };
  }
  // Without a title, the AI's pick of the most relevant role is usually right;
  // the rules have less to go on, so they don't guess between roles.
  if (strict) return { app: null, reason: `${candidates.length} applications at ${company}; email doesn't say which role` };
  return { app: pickMostRelevant(candidates) };
}

/* ── Applying a classification ─────────────────────────────────────────── */

type Outcome = { action: EmailSyncAction; detail: string | null; applicationId: string | null };

const LABEL: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

async function setStatus(
  app: AppRow,
  clerkUserId: string,
  status: ApplicationStatus,
  emailDate: Date
): Promise<Outcome> {
  const from = app.status;
  await updateApplicationStatus(app.id, clerkUserId, status);
  const dates =
    status === "APPLIED"
      ? { dateApplied: emailDate }
      : status === "REJECTED"
        ? { rejectionDate: emailDate }
        : null;
  if (dates) {
    // Only fill in a date the user hasn't set themselves
    await prisma.application.updateMany({
      where: {
        id: app.id,
        ...(status === "APPLIED" ? { dateApplied: null } : { rejectionDate: null }),
      },
      data: dates,
    });
  }
  app.status = status;
  return { action: "STATUS_UPDATED", detail: `${LABEL[from]} → ${LABEL[status]}`, applicationId: app.id };
}

async function apply(
  clerkUserId: string,
  apps: AppRow[],
  message: GmailMessage,
  cls: Classification
): Promise<Outcome> {
  const ignore = (detail: string, applicationId: string | null = null): Outcome => ({
    action: "IGNORED",
    detail,
    applicationId,
  });

  if (cls.classification === "NOT_JOB") return ignore("Not about an application");
  if (cls.confidence === "low") return ignore("Low confidence — not applied");

  const match = findMatch(apps, cls.company, cls.title, cls.source === "rules");
  const app = match.app;

  if (!app) {
    if (cls.classification === "APPLIED" && cls.confidence === "high" && cls.company && cls.title) {
      const created = await createApplication(clerkUserId, {
        title: cls.title,
        company: cls.company,
        status: ApplicationStatus.APPLIED,
        dateApplied: message.date.toISOString(),
      });
      apps.push({
        id: created.id,
        company: created.company,
        title: created.title,
        status: created.status,
        createdAt: created.createdAt,
        onlineAssessment: null,
      });
      return { action: "CREATED", detail: "Added as Applied", applicationId: created.id };
    }
    return { action: "UNMATCHED", detail: match.reason ?? "No matching application", applicationId: null };
  }

  // An old thread for an application already closed out shouldn't reopen it.
  if (app.status === "REJECTED" && cls.classification !== "OFFER") {
    return ignore("Already rejected", app.id);
  }

  switch (cls.classification) {
    case "APPLIED":
      if (app.status === "SAVED") return setStatus(app, clerkUserId, "APPLIED", message.date);
      return ignore(`Already tracked as ${LABEL[app.status]}`, app.id);

    case "REJECTED":
      return setStatus(app, clerkUserId, "REJECTED", message.date);

    case "INTERVIEW":
      if (RANK[app.status] < RANK.INTERVIEW) return setStatus(app, clerkUserId, "INTERVIEW", message.date);
      return ignore(`Already ${LABEL[app.status]}`, app.id);

    case "OFFER":
      if (app.status !== "OFFER") return setStatus(app, clerkUserId, "OFFER", message.date);
      return ignore("Already Offer", app.id);

    case "OA": {
      if (app.status === "SAVED") await setStatus(app, clerkUserId, "APPLIED", message.date);
      if (app.onlineAssessment) return ignore("OA already on record", app.id);
      await upsertOA(app.id, clerkUserId, { notes: `From email: ${message.subject}`.slice(0, 500) });
      app.onlineAssessment = { id: "pending" };
      return { action: "OA_ADDED", detail: "Online assessment added", applicationId: app.id };
    }
  }
}

/* ── Sync ──────────────────────────────────────────────────────────────── */

export async function syncGmail(clerkUserId: string): Promise<SyncSummary> {
  if (running.has(clerkUserId)) throw new SyncInProgressError();
  running.add(clerkUserId);
  try {
    return await runSync(clerkUserId);
  } catch (err) {
    // Every failure lands on the connection so Settings can show it.
    const lastError = describeError(err);
    await prisma.gmailConnection
      .updateMany({ where: { clerkUserId }, data: { lastError } })
      .catch(() => {});
    throw new Error(lastError);
  } finally {
    running.delete(clerkUserId);
  }
}

async function runSync(clerkUserId: string): Promise<SyncSummary> {
  const conn = await prisma.gmailConnection.findUnique({ where: { clerkUserId } });
  if (!conn) throw new Error("Gmail is not connected");

  let accessToken: string;
  try {
    accessToken = await refreshAccessToken(decrypt(conn.refreshToken));
  } catch (err) {
    const revoked = (err as any).code === "invalid_grant";
    if (revoked) {
      await prisma.gmailConnection.update({ where: { clerkUserId }, data: { syncEnabled: false } });
      throw new Error("Google access was revoked. Reconnect Gmail to resume syncing.");
    }
    throw err;
  }

  const now = new Date();
  const since = conn.lastSyncedAt
    ? new Date(conn.lastSyncedAt.getTime() - OVERLAP_MS)
    : new Date(now.getTime() - INITIAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const ids = await listMessageIds(accessToken, candidateQuery(Math.floor(since.getTime() / 1000)), MAX_MESSAGES_PER_SYNC);
  const seen = new Set(
    (
      await prisma.emailSyncEvent.findMany({
        where: { clerkUserId, gmailMessageId: { in: ids } },
        select: { gmailMessageId: true },
      })
    ).map((e) => e.gmailMessageId)
  );
  const newIds = ids.filter((id) => !seen.has(id));

  const summary: SyncSummary = { scanned: newIds.length, created: 0, updated: 0, oaAdded: 0, unmatched: 0, ignored: 0 };

  if (newIds.length > 0) {
    const messages = (await getMessages(accessToken, newIds)).sort((a, b) => a.date.getTime() - b.date.getTime());
    const apps: AppRow[] = await prisma.application.findMany({
      where: { clerkUserId },
      select: {
        id: true,
        company: true,
        title: true,
        status: true,
        createdAt: true,
        onlineAssessment: { select: { id: true } },
      },
    });
    // The rule-based classifier finds companies by looking for the ones already tracked.
    const classes = new Map((await classifyEmails(messages, apps)).map((c) => [c.id, c]));

    for (const message of messages) {
      const cls = classes.get(message.id)!;
      let outcome: Outcome;
      try {
        outcome = await apply(clerkUserId, apps, message, cls);
      } catch (err) {
        console.error(`Gmail sync: failed to apply ${message.id}:`, err);
        outcome = { action: "IGNORED", detail: `Error: ${(err as Error).message}`.slice(0, 300), applicationId: null };
      }

      switch (outcome.action) {
        case "CREATED": summary.created++; break;
        case "STATUS_UPDATED": summary.updated++; break;
        case "OA_ADDED": summary.oaAdded++; break;
        case "UNMATCHED": summary.unmatched++; break;
        default: summary.ignored++;
      }

      await prisma.emailSyncEvent
        .create({
          data: {
            clerkUserId,
            gmailMessageId: message.id,
            applicationId: outcome.applicationId,
            action: outcome.action,
            classification: cls.classification,
            company: cls.company,
            title: cls.title,
            subject: message.subject.slice(0, 300),
            sender: message.from.slice(0, 200),
            receivedAt: message.date,
            detail: outcome.detail,
          },
        })
        .catch(() => {
          // Unique violation from a concurrent run; the message is recorded either way.
        });
    }
  }

  await prisma.gmailConnection.update({
    where: { clerkUserId },
    data: { lastSyncedAt: now, lastError: null },
  });
  return summary;
}

/** Runs every connection with auto-sync on. Errors are logged, never thrown. */
export async function runScheduledSyncs(): Promise<void> {
  const connections = await prisma.gmailConnection.findMany({
    where: { syncEnabled: true },
    select: { clerkUserId: true },
  });
  for (const { clerkUserId } of connections) {
    try {
      const s = await syncGmail(clerkUserId);
      console.log(`Gmail sync for ${clerkUserId}: ${s.scanned} scanned, ${s.updated} updated, ${s.created} created`);
    } catch (err) {
      if (!(err instanceof SyncInProgressError)) console.error(`Gmail sync for ${clerkUserId} failed:`, (err as Error).message);
    }
  }
}
