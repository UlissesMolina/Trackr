import openai from "../lib/openai";
import type { GmailMessage } from "./gmail.service";

export type EmailClass = "APPLIED" | "REJECTED" | "INTERVIEW" | "OA" | "OFFER" | "NOT_JOB";
export type Confidence = "high" | "medium" | "low";

export interface Classification {
  id: string;
  classification: EmailClass;
  company: string | null;
  title: string | null;
  confidence: Confidence;
}

const CLASSES: EmailClass[] = ["APPLIED", "REJECTED", "INTERVIEW", "OA", "OFFER", "NOT_JOB"];
const BATCH_SIZE = 8;

const SYSTEM_PROMPT = `You classify emails from a job seeker's inbox. For each email decide what it means for ONE specific job application they submitted.

Classifications:
- APPLIED: confirmation that their application was received / submitted ("thanks for applying", "we received your application").
- REJECTED: they are no longer being considered for a role they applied to.
- INTERVIEW: an invitation to, or scheduling of, an interview, phone screen, or recruiter call for a role they applied to.
- OA: an invitation to complete an online assessment, coding challenge, HackerRank/CodeSignal test, or take-home.
- OFFER: a job offer or offer letter.
- NOT_JOB: anything else. This includes job alerts and digests ("new jobs for you"), newsletters, recruiter cold outreach about roles they did NOT apply to, marketing, event invites, referral requests, account/password emails, and generic "we're still reviewing" status updates with no decision.

For each email also extract:
- company: the hiring company (not the ATS vendor like Greenhouse, Lever, Workday, or a job board), or null.
- title: the job title as written in the email, or null if not stated.
- confidence: "high", "medium" or "low" for the classification.

Respond with JSON: {"results": [{"id": "...", "classification": "...", "company": ..., "title": ..., "confidence": "..."}]}. Include every id exactly once.`;

function formatEmail(m: GmailMessage): string {
  return [
    `<email id="${m.id}">`,
    `From: ${m.from}`,
    `Subject: ${m.subject}`,
    `Date: ${m.date.toISOString().slice(0, 10)}`,
    "",
    m.body,
    "</email>",
  ].join("\n");
}

async function classifyBatch(batch: GmailMessage[]): Promise<Classification[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: batch.map(formatEmail).join("\n\n") },
    ],
    temperature: 0,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed: { results?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const results = Array.isArray(parsed.results) ? parsed.results : [];
  const byId = new Map<string, Classification>();
  for (const r of results as Record<string, unknown>[]) {
    const id = String(r.id ?? "");
    const cls = String(r.classification ?? "").toUpperCase() as EmailClass;
    if (!id || !CLASSES.includes(cls)) continue;
    const conf = String(r.confidence ?? "low").toLowerCase();
    byId.set(id, {
      id,
      classification: cls,
      company: typeof r.company === "string" && r.company.trim() ? r.company.trim() : null,
      title: typeof r.title === "string" && r.title.trim() ? r.title.trim() : null,
      confidence: conf === "high" || conf === "medium" ? conf : "low",
    });
  }
  // Anything the model dropped is treated as not a job email, so it's logged and never re-sent.
  return batch.map(
    (m) => byId.get(m.id) ?? { id: m.id, classification: "NOT_JOB", company: null, title: null, confidence: "low" }
  );
}

export async function classifyEmails(messages: GmailMessage[]): Promise<Classification[]> {
  const out: Classification[] = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    out.push(...(await classifyBatch(messages.slice(i, i + BATCH_SIZE))));
  }
  return out;
}
