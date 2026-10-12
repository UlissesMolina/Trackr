import type { Application, Interview } from "../types";

export type AttentionKind = "FOLLOW_UP_OVERDUE" | "OA_DUE_SOON" | "INTERVIEW_SOON" | "STALE";

export interface AttentionItem {
  kind: AttentionKind;
  key: string;
  application: Application;
  /** Due date, scheduled time, or last activity (for STALE). */
  date: Date;
  /**
   * FOLLOW_UP_OVERDUE: days overdue. OA_DUE_SOON / INTERVIEW_SOON: days until
   * (negative = past due). STALE: days since last activity.
   */
  days: number;
  interview?: Interview;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const OA_WINDOW_DAYS = 3;
const INTERVIEW_WINDOW_DAYS = 7;

const KIND_ORDER: Record<AttentionKind, number> = {
  FOLLOW_UP_OVERDUE: 0,
  OA_DUE_SOON: 1,
  INTERVIEW_SOON: 2,
  STALE: 3,
};

const STALE_STATUSES = new Set(["APPLIED", "UNDER_REVIEW"]);

function lastActivity(app: Application): Date {
  const times = [app.statusChangedAt, app.dateApplied, app.createdAt]
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime());
  return new Date(Math.max(...times));
}

export function daysSinceActivity(app: Application, now: Date): number {
  return Math.floor((now.getTime() - lastActivity(app).getTime()) / DAY_MS);
}

/**
 * followUpDate is a calendar day the server stores as UTC midnight. Read it back as
 * that same day at local midnight so "tomorrow" never looks overdue west of UTC.
 */
function followUpDay(followUpDate: string): Date {
  const [y, m, d] = followUpDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * An application is stale when it's waiting on the company (APPLIED / UNDER_REVIEW)
 * with no activity for more than `staleDays`. A follow-up due today or later snoozes it.
 */
export function isStale(app: Application, now: Date, staleDays: number): boolean {
  if (!STALE_STATUSES.has(app.status)) return false;
  if (app.followUpDate && followUpDay(app.followUpDate) >= startOfDay(now)) return false;
  return daysSinceActivity(app, now) > staleDays;
}

export function getAttentionItems(apps: Application[], now: Date, staleDays: number): AttentionItem[] {
  const items: AttentionItem[] = [];
  const nowMs = now.getTime();

  for (const app of apps) {
    if (app.status === "REJECTED") continue;

    if (app.followUpDate && app.status !== "OFFER") {
      const due = followUpDay(app.followUpDate);
      const today = startOfDay(now);
      if (due < today) {
        items.push({
          kind: "FOLLOW_UP_OVERDUE",
          key: `followup-${app.id}`,
          application: app,
          date: due,
          // round, not floor: a DST change makes one calendar day 23 or 25 hours
          days: Math.round((today.getTime() - due.getTime()) / DAY_MS),
        });
      }
    }

    const oa = app.onlineAssessment;
    if (oa?.status === "PENDING" && oa.dueDate) {
      const due = new Date(oa.dueDate);
      const daysUntil = Math.ceil((due.getTime() - nowMs) / DAY_MS);
      if (daysUntil <= OA_WINDOW_DAYS) {
        items.push({ kind: "OA_DUE_SOON", key: `oa-${app.id}`, application: app, date: due, days: daysUntil });
      }
    }

    for (const interview of app.interviews ?? []) {
      const at = new Date(interview.scheduledAt);
      const msUntil = at.getTime() - nowMs;
      if (msUntil >= 0 && msUntil <= INTERVIEW_WINDOW_DAYS * DAY_MS) {
        items.push({
          kind: "INTERVIEW_SOON",
          key: `interview-${interview.id}`,
          application: app,
          date: at,
          days: Math.floor(msUntil / DAY_MS),
          interview,
        });
      }
    }

    if (isStale(app, now, staleDays)) {
      items.push({
        kind: "STALE",
        key: `stale-${app.id}`,
        application: app,
        date: lastActivity(app),
        days: daysSinceActivity(app, now),
      });
    }
  }

  return items.sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.date.getTime() - b.date.getTime()
  );
}
