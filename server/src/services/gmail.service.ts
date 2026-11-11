// Google OAuth and the Gmail REST API, called directly with fetch. The scope is
// read-only; Trackr never sends, labels or deletes mail.

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GMAIL_URL = "https://gmail.googleapis.com/gmail/v1/users/me";
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export function isGmailConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // needed for a refresh token
    prompt: "consent", // Google only returns a refresh token on consent
    state,
  });
  return `${AUTH_URL}?${params}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...body,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, string>;
  if (!res.ok) {
    const err = new Error(`Google token error: ${json.error ?? res.status} ${json.error_description ?? ""}`.trim());
    (err as any).code = json.error;
    throw err;
  }
  return json;
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; refreshToken: string | null }> {
  const json = await tokenRequest({
    code,
    grant_type: "authorization_code",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
  });
  return { accessToken: json.access_token, refreshToken: json.refresh_token ?? null };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const json = await tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
  return json.access_token;
}

/** Best effort; a failed revoke shouldn't block disconnecting. */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: "POST" });
  } catch {
    // ignore
  }
}

async function gmailGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL_URL}/${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Gmail ${res.status} on ${path.split("?")[0]}: ${text.slice(0, 200)}`);
    (err as any).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function getProfile(accessToken: string): Promise<{ emailAddress: string }> {
  return gmailGet(accessToken, "profile");
}

/**
 * Search query for mail that might be about a job application. Gmail's search
 * does the cheap filtering; the classifier does the rest.
 */
export function candidateQuery(afterEpochSeconds: number): string {
  const subjects = [
    "application", "applied", "applying", "interview", "assessment", "offer",
    "\"next steps\"", "unfortunately", "candidacy", "\"your candidacy\"",
    "\"thank you for your interest\"", "\"moving forward\"", "position", "role",
    "recruiting", "\"hiring team\"", "\"coding challenge\"", "hackerrank", "codesignal",
  ];
  const senders = [
    "greenhouse", "lever.co", "myworkday", "workday", "ashbyhq", "smartrecruiters",
    "icims", "jobvite", "hirevue", "hackerrank", "codesignal", "taleo", "successfactors",
    "recruiting", "talent", "careers", "jobs",
  ];
  return [
    `after:${afterEpochSeconds}`,
    "-category:promotions",
    "-category:social",
    "-in:chats",
    `(subject:(${subjects.join(" OR ")}) OR from:(${senders.join(" OR ")}))`,
  ].join(" ");
}

export async function listMessageIds(accessToken: string, q: string, max = 300): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ q, maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await gmailGet<{ messages?: { id: string }[]; nextPageToken?: string }>(
      accessToken,
      `messages?${params}`
    );
    for (const m of page.messages ?? []) ids.push(m.id);
    pageToken = page.nextPageToken;
  } while (pageToken && ids.length < max);
  return ids.slice(0, max);
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: Date;
  body: string;
}

interface Part {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: Part[];
  headers?: { name: string; value: string }[];
}

function decodeBody(data: string | undefined): string {
  return data ? Buffer.from(data, "base64url").toString("utf8") : "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>|<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/** Prefer text/plain; fall back to stripped text/html. */
function extractText(part: Part): { plain: string; html: string } {
  let plain = "";
  let html = "";
  const walk = (p: Part) => {
    if (p.mimeType === "text/plain" && p.body?.data) plain += decodeBody(p.body.data) + "\n";
    else if (p.mimeType === "text/html" && p.body?.data) html += decodeBody(p.body.data);
    for (const child of p.parts ?? []) walk(child);
  };
  walk(part);
  return { plain: plain.trim(), html };
}

const BODY_LIMIT = 3000;

export async function getMessage(accessToken: string, id: string): Promise<GmailMessage> {
  const msg = await gmailGet<{ id: string; threadId: string; internalDate: string; payload: Part }>(
    accessToken,
    `messages/${id}?format=full`
  );
  const header = (name: string) =>
    msg.payload.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
  const { plain, html } = extractText(msg.payload);
  const body = (plain || stripHtml(html)).replace(/\r/g, "").slice(0, BODY_LIMIT);
  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: header("Subject"),
    from: header("From"),
    date: new Date(Number(msg.internalDate)),
    body,
  };
}

/** Fetch messages a few at a time so one slow request doesn't serialize the rest. */
export async function getMessages(accessToken: string, ids: string[], concurrency = 5): Promise<GmailMessage[]> {
  const out: GmailMessage[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length) }, async () => {
      while (i < ids.length) {
        const id = ids[i++];
        try {
          out.push(await getMessage(accessToken, id));
        } catch (err) {
          console.warn(`Gmail: skipping message ${id}:`, (err as Error).message);
        }
      }
    })
  );
  return out;
}
