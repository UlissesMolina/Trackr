// Rule-based email classifier: the free, private fallback when no OpenAI key is
// configured. Nothing leaves the server.
//
// Job-application email is formulaic, so phrase lists catch most of it. The
// hard part is knowing which company an email is about, so instead of trying
// to parse names out of free text, it looks for the companies the user
// already tracks — in the sender, the subject, then the body.

import type { Classification, Confidence, EmailClass } from "./email-classifier.service";
import type { GmailMessage } from "./gmail.service";
import { normalizeCompany, normalizeTitle } from "../lib/dedup";

export interface KnownApplication {
  company: string;
  title: string;
}

/* ── Phrase lists ──────────────────────────────────────────────────────── */

// Alerts, digests and account mail that mention jobs but aren't about an application.
const NOT_JOB_SUBJECT = [
  "job alert", "jobs for you", "new jobs", "jobs you may", "recommended jobs", "is hiring",
  "are hiring", "new opportunities", "weekly digest", "newsletter", "webinar", "event invitation",
  "verify your email", "verify your account", "confirm your email", "reset your password",
  "verification code", "security code", "one-time", "sign in to", "welcome to",
];
const NOT_JOB_BODY = [
  "jobs you might be interested in", "based on your profile", "new jobs matching",
  "recommended for you", "you're receiving this job alert", "manage your job alerts",
];

const OFFER = [
  "pleased to offer you", "delighted to offer you", "excited to offer you", "happy to offer you",
  "offer of employment", "your offer letter", "attached offer letter", "extend an offer",
  "extend you an offer", "extending an offer", "formal offer", "verbal offer",
];

const REJECTED_STRONG = [
  "not to move forward", "not moving forward", "won't be moving forward", "will not be moving forward",
  "not be moving forward", "decided to move forward with other", "move forward with other candidates",
  "moving forward with other candidates", "pursue other candidates", "decided to pursue other",
  "proceed with other candidates", "other candidates whose", "candidates whose experience",
  "will not be proceeding", "not be proceeding", "won't be proceeding", "decided not to proceed",
  "not been selected", "were not selected", "was not selected", "have not been selected",
  "position has been filled", "role has been filled", "no longer under consideration",
  "no longer being considered", "unable to offer you", "regret to inform", "not a match at this time",
  "not the right fit", "decided to go in a different direction", "will not be offering",
  "not able to move forward", "unable to move forward",
];
const APPLICATION_CONTEXT = ["application", "candidacy", "position", "role", "opportunity", "applying"];

const OA_SENDERS = ["hackerrank", "codesignal", "codility", "hirevue", "testgorilla", "coderbyte", "imocha", "mettl", "karat"];
const OA = [
  "online assessment", "coding challenge", "coding assessment", "technical assessment",
  "skills assessment", "assessment invitation", "invitation to complete", "complete the assessment",
  "complete your assessment", "take-home", "take home assignment", "hackerrank", "codesignal",
  "codility", "hirevue", "coding test", "programming challenge",
];

const INTERVIEW_STRONG = [
  "schedule an interview", "schedule your interview", "schedule a interview", "invite you to interview",
  "invitation to interview", "interview invitation", "would like to interview", "like to invite you",
  "next round", "phone screen", "phone interview", "video interview", "technical interview",
  "final round", "onsite interview", "interview has been scheduled", "interview is confirmed",
  "interview confirmation", "schedule a call", "set up a call", "set up a time", "find a time",
  "your availability", "share your availability", "move you forward", "moving you forward",
  "advance you to", "next step in our process", "next steps in our process",
];
const INTERVIEW_LINKS = ["calendly.com", "goodtime.io", "cal.com", "calendar.app.google", "doodle.com", "zoom.us/j"];

const APPLIED = [
  "thank you for applying", "thanks for applying", "thank you for your application",
  "thanks for your application", "application has been received", "received your application",
  "we have received your application", "we've received your application", "application was received",
  "application has been submitted", "application was submitted", "successfully submitted",
  "your application was sent", "application received", "thank you for submitting",
  "we got your application",
];

// Who sent it doesn't name the employer: ATSes, job boards, mail providers.
const GENERIC_SENDER = new Set([
  "greenhouse", "lever", "workday", "myworkday", "myworkdaysite", "ashby", "ashbyhq", "icims",
  "smartrecruiters", "jobvite", "taleo", "successfactors", "bamboohr", "breezy", "workable",
  "recruitee", "teamtailor", "rippling", "gem", "linkedin", "indeed", "handshake", "glassdoor",
  "ziprecruiter", "wellfound", "angellist", "simplify", "hackerrank", "codesignal", "codility",
  "hirevue", "gmail", "googlemail", "outlook", "hotmail", "yahoo", "icloud", "noreply", "no-reply",
  "donotreply", "notifications", "notification", "mail", "email", "careers", "jobs", "recruiting",
  "talent", "hr", "team", "hello", "info",
]);
// Matched inside sending domains, which vary per vendor ("greenhouse-mail.io").
const ATS_VENDORS = [
  "greenhouse", "lever", "workday", "ashby", "icims", "smartrecruiters", "jobvite", "taleo",
  "successfactors", "bamboohr", "workable", "recruitee", "teamtailor", "linkedin", "indeed",
  "handshake", "hackerrank", "codesignal", "hirevue",
];
const SENDER_SUFFIX = /\s*[-–|,]?\s*(university\s+)?(recruiting|recruitment|recruiter|talent acquisition|talent team|talent|careers?|hiring team|hiring|hr|people team|people|jobs|team|no-?reply)\s*$/i;

/* ── Helpers ───────────────────────────────────────────────────────────── */

function clean(s: string): string {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ");
}

function hasAny(text: string, phrases: string[]): boolean {
  return phrases.some((p) => text.includes(p));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word, case-insensitive search for a company name. Short names need an exact case match. */
function mentions(text: string, name: string): number {
  const n = name.trim();
  if (n.length < 2) return -1;
  const flags = n.length <= 4 ? "" : "i"; // "Box", "Ramp" vs. "box", "ramp"
  const m = new RegExp(`(^|[^\\w])${escapeRegex(n)}(?=$|[^\\w])`, flags).exec(text);
  return m ? m.index + m[1].length : -1;
}

function parseSender(from: string): { name: string; local: string; domain: string } {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>/.exec(from);
  const name = (m ? m[1] : "").trim();
  const addr = (m ? m[2] : from).trim().toLowerCase();
  const [local = "", host = ""] = addr.split("@");
  const parts = host.split(".");
  // The registrable part: "mail.stripe.com" → "stripe"; "stripe.co.uk" → "stripe"
  const domain = parts.length >= 3 && parts[parts.length - 2].length <= 3 ? parts[parts.length - 3] : parts[parts.length - 2] ?? "";
  return { name, local, domain };
}

/** Company names to try for one message, most trustworthy first. */
function senderCandidates(from: string): string[] {
  const { name, local, domain } = parseSender(from);
  const out: string[] = [];
  const display = name.replace(SENDER_SUFFIX, "").replace(/\s+(via|at)\s+.*$/i, "").trim();
  if (display && !GENERIC_SENDER.has(display.toLowerCase())) out.push(display);
  // Workday sends from <company>@myworkday.com
  if ((domain === "myworkday" || domain === "myworkdaysite") && local && !GENERIC_SENDER.has(local)) out.push(local);
  // Vendors send from variants like "greenhouse-mail" or "lever-mail"
  if (domain && !GENERIC_SENDER.has(domain) && !ATS_VENDORS.some((v) => domain.includes(v))) out.push(domain);
  return out;
}

/* ── Company and title ─────────────────────────────────────────────────── */

type CompanyHit = { company: string; where: "sender" | "subject" | "body" };

function findTrackedCompany(m: GmailMessage, known: KnownApplication[], body: string): CompanyHit | null {
  const companies = [...new Map(known.map((k) => [normalizeCompany(k.company), k.company])).entries()].filter(
    ([norm]) => norm.length >= 2
  );
  const senders = senderCandidates(m.from).map(normalizeCompany);

  // 1. The sender is the company ("Stripe Recruiting", careers@stripe.com)
  for (const [norm, display] of companies) {
    if (senders.some((s) => s === norm || s.replace(/\s/g, "") === norm.replace(/\s/g, ""))) {
      return { company: display, where: "sender" };
    }
  }

  // 2. Named in the subject; 3. named in the body. Earliest mention wins,
  //    longer names break ties ("Capital One" over "One").
  for (const [where, text] of [["subject", m.subject], ["body", body]] as const) {
    let best: { display: string; at: number; len: number } | null = null;
    for (const [, display] of companies) {
      const at = Math.min(
        ...[display, display.replace(/\s*(inc\.?|llc|corp\.?|ltd\.?)$/i, "")]
          .map((d) => mentions(text, d))
          .filter((i) => i >= 0)
          .concat(Infinity)
      );
      if (at === Infinity) continue;
      if (!best || at < best.at || (at === best.at && display.length > best.len)) {
        best = { display, at, len: display.length };
      }
    }
    if (best) return { company: best.display, where };
  }
  return null;
}

/** "Thank you for applying to Acme" — company names for apps the user doesn't track yet. */
function extractCompanyFromText(subject: string, body: string, from: string): string | null {
  const patterns = [
    /(?:applying|application|applied) (?:to|at|with) ([A-Z][\w&.' -]{1,40}?)(?:[!.,:;|]|\s+for\b|\s+-|$)/,
    /your application was sent to ([A-Z][\w&.' -]{1,40}?)(?:[!.,:;|]|$)/,
    /interest in (?:joining |working (?:at|for) )?([A-Z][\w&.' -]{1,40}?)(?:[!.,:;]|\s+and\b|$)/,
    /(?:position|role|opportunity) (?:at|with) ([A-Z][\w&.' -]{1,40}?)(?:[!.,:;]|\s+and\b|$)/,
  ];
  for (const text of [subject, body.slice(0, 800)]) {
    for (const re of patterns) {
      const m = re.exec(text);
      const name = m?.[1]?.trim();
      if (name && !GENERIC_SENDER.has(name.toLowerCase())) return name;
    }
  }
  return senderCandidates(from)[0] ?? null;
}

function extractTitle(subject: string, body: string): string | null {
  const patterns = [
    /(?:for|to) the ([A-Z][\w/&,()' -]{2,80}?) (?:position|role|opening|job)\b/,
    /(?:applying|application|applied) (?:for|to) (?:the )?([A-Z][\w/&,()' -]{2,80}?)(?: position| role)? (?:at|with)\b/,
    /^(?:re:\s*)?([A-Z][\w/&,()' -]{2,80}?) (?:at|@) [A-Z]/,
  ];
  for (const text of [subject, body.slice(0, 800)]) {
    for (const re of patterns) {
      const t = re.exec(text)?.[1]?.trim();
      if (t && t.split(" ").length <= 12) return t;
    }
  }
  return null;
}

/** Of the user's roles at this company, the one the email names, if exactly one. */
function matchTrackedTitle(company: string, known: KnownApplication[], text: string): string | null {
  const c = normalizeCompany(company);
  const lower = text.toLowerCase();
  const hits = known
    .filter((k) => normalizeCompany(k.company) === c)
    .map((k) => k.title)
    .filter((t) => {
      const core = normalizeTitle(t).replace(/\s*[-–—]\s*.*$/, "").replace(/\s*\(.*\)$/, "").trim();
      return core.length >= 3 && lower.includes(core);
    });
  const unique = [...new Set(hits)];
  return unique.length === 1 ? unique[0] : null;
}

/* ── Classification ────────────────────────────────────────────────────── */

function detect(subjectLc: string, text: string, fromLc: string): { cls: EmailClass; strong: boolean } {
  if (hasAny(subjectLc, NOT_JOB_SUBJECT) || hasAny(text, NOT_JOB_BODY)) return { cls: "NOT_JOB", strong: true };
  if (hasAny(text, OFFER)) return { cls: "OFFER", strong: true };
  if (hasAny(text, REJECTED_STRONG)) return { cls: "REJECTED", strong: true };
  if (text.includes("unfortunately") && hasAny(text, APPLICATION_CONTEXT)) return { cls: "REJECTED", strong: false };
  if (hasAny(fromLc, OA_SENDERS)) return { cls: "OA", strong: true };
  if (hasAny(text, OA)) return { cls: "OA", strong: hasAny(text, ["invit", "complete", "assessment"]) };
  if (hasAny(text, INTERVIEW_STRONG)) return { cls: "INTERVIEW", strong: true };
  if (hasAny(text, INTERVIEW_LINKS) && text.includes("interview")) return { cls: "INTERVIEW", strong: false };
  if (hasAny(text, APPLIED)) return { cls: "APPLIED", strong: true };
  return { cls: "NOT_JOB", strong: false };
}

export function classifyWithRules(messages: GmailMessage[], known: KnownApplication[]): Classification[] {
  return messages.map((m) => {
    const subject = clean(m.subject);
    const body = clean(m.body);
    const text = `${subject}\n${body}`.toLowerCase();
    const { cls, strong } = detect(subject.toLowerCase(), text, m.from.toLowerCase());

    if (cls === "NOT_JOB") {
      return { id: m.id, classification: "NOT_JOB", company: null, title: null, confidence: "high", source: "rules" };
    }

    const hit = findTrackedCompany({ ...m, subject }, known, body);
    const company = hit?.company ?? extractCompanyFromText(subject, body, m.from);
    const title = (hit && matchTrackedTitle(hit.company, known, `${subject}\n${body}`)) || extractTitle(subject, body);

    // Confident only when the phrase is unambiguous and the company came from
    // somewhere reliable; body-only mentions can be a footer or a reference.
    let confidence: Confidence;
    if (!company) confidence = "low";
    else if (strong && (hit?.where === "sender" || hit?.where === "subject")) confidence = "high";
    else if (strong || hit?.where === "sender" || hit?.where === "subject") confidence = "medium";
    else confidence = "low";

    return { id: m.id, classification: cls, company, title, confidence, source: "rules" };
  });
}
