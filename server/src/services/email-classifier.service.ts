import { APIError, OpenAIError } from "openai";
import { getOpenAI, isOpenAIConfigured } from "../lib/openai";
import type { GmailMessage } from "./gmail.service";
import { classifyWithRules, type KnownApplication } from "./email-rules.service";

export type EmailClass = "APPLIED" | "REJECTED" | "INTERVIEW" | "OA" | "OFFER" | "NOT_JOB";
export type Confidence = "high" | "medium" | "low";

export interface Classification {
  id: string;
  classification: EmailClass;
  company: string | null;
  title: string | null;
  confidence: Confidence;
  /** Rules can't read titles reliably, so their matches are held to a stricter bar. */
  source: "ai" | "rules";
}

const CLASSES: EmailClass[] = ["APPLIED", "REJECTED", "INTERVIEW", "OA", "OFFER", "NOT_JOB"];
const BATCH_SIZE = 8;
// Sorting emails into six buckets doesn't need a large model; mini is ~15x cheaper.
const MODEL = "gpt-4o-mini";

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
  const response = await getOpenAI().chat.completions.create({
    model: MODEL,
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
      source: "ai",
    });
  }
  // Anything the model dropped is treated as not a job email, so it's logged and never re-sent.
  return batch.map(
    (m) =>
      byId.get(m.id) ?? { id: m.id, classification: "NOT_JOB", company: null, title: null, confidence: "low", source: "ai" }
  );
}

function describeOpenAIError(err: OpenAIError): string {
  const status = err instanceof APIError ? err.status : undefined;
  if (status === 401) return "OpenAI rejected the API key";
  if (status === 403 || status === 404) return `OpenAI can't use ${MODEL} with this key (${status})`;
  if (status === 429) return "OpenAI rate limit or quota reached";
  return `OpenAI error${status ? ` (${status})` : ""}: ${err.message}`.slice(0, 200);
}

/**
 * Classifies with OpenAI when a key is configured, otherwise with the
 * rule-based classifier. Any OpenAI failure (bad key, no model access, quota,
 * outage) falls back to rules for the rest of the run, so AI trouble never
 * stops a sync; `aiProblem` says what went wrong.
 */
export async function classifyEmails(
  messages: GmailMessage[],
  known: KnownApplication[]
): Promise<{ results: Classification[]; aiProblem: string | null }> {
  if (!isOpenAIConfigured()) return { results: classifyWithRules(messages, known), aiProblem: null };

  const results: Classification[] = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    try {
      results.push(...(await classifyBatch(messages.slice(i, i + BATCH_SIZE))));
    } catch (err) {
      if (!(err instanceof OpenAIError)) throw err;
      const aiProblem = describeOpenAIError(err);
      console.warn(`${aiProblem}; classifying the rest of this sync with rules.`);
      results.push(...classifyWithRules(messages.slice(i), known));
      return { results, aiProblem };
    }
  }
  return { results, aiProblem: null };
}
