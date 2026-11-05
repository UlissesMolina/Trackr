// Looks up the date a company actually published a job, straight from its
// applicant tracking system. SimplifyJobs' `date_posted` is when the listing
// was added to their repo, which can lag the real posting by weeks.
//
// Supported: Greenhouse, Ashby, Lever, SmartRecruiters. Anything else → null.

const FETCH_TIMEOUT_MS = 3000;
const DATE_TTL_MS = 24 * 60 * 60 * 1000; // publish dates don't change
const MISS_TTL_MS = 60 * 60 * 1000; // retry failures/unknowns hourly
const ASHBY_BOARD_TTL_MS = 60 * 60 * 1000;

type CacheEntry = { value: number | null; expires: number };

const dateCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<number | null>>();
const ashbyBoards = new Map<string, { dates: Map<string, number>; expires: number }>();
const ashbyInFlight = new Map<string, Promise<Map<string, number>>>();

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.json();
}

/** Parses an ISO string or millisecond epoch into Unix seconds. */
function toUnixSeconds(value: unknown): number | null {
  if (typeof value === "number") return Math.floor(value / 1000);
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
  }
  return null;
}

async function fetchGreenhouse(board: string, jobId: string): Promise<number | null> {
  const data = await fetchJson(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs/${encodeURIComponent(jobId)}`
  );
  return toUnixSeconds(data.first_published);
}

async function fetchLever(host: string, company: string, postingId: string): Promise<number | null> {
  const apiHost = host.includes(".eu.") ? "api.eu.lever.co" : "api.lever.co";
  const data = await fetchJson(
    `https://${apiHost}/v0/postings/${encodeURIComponent(company)}/${encodeURIComponent(postingId)}`
  );
  return toUnixSeconds(data.createdAt);
}

async function fetchSmartRecruiters(company: string, postingId: string): Promise<number | null> {
  const data = await fetchJson(
    `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company)}/postings/${encodeURIComponent(postingId)}`
  );
  return toUnixSeconds(data.releasedDate);
}

// Ashby has no single-posting endpoint, so fetch the org's whole board once
// and share it across every job from that org.
async function getAshbyBoard(org: string): Promise<Map<string, number>> {
  const cached = ashbyBoards.get(org);
  if (cached && cached.expires > Date.now()) return cached.dates;

  let pending = ashbyInFlight.get(org);
  if (!pending) {
    pending = (async () => {
      const data = await fetchJson(
        `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(org)}`
      );
      const dates = new Map<string, number>();
      for (const job of data.jobs ?? []) {
        const ts = toUnixSeconds(job.publishedAt);
        if (job.id && ts) dates.set(job.id, ts);
      }
      ashbyBoards.set(org, { dates, expires: Date.now() + ASHBY_BOARD_TTL_MS });
      return dates;
    })().finally(() => ashbyInFlight.delete(org));
    ashbyInFlight.set(org, pending);
  }
  return pending;
}

async function lookup(rawUrl: string): Promise<number | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  if (host.endsWith("greenhouse.io")) {
    // /{board}/jobs/{id}, or /embed/job_app?for={board}&token={id}
    const board = url.searchParams.get("for") ?? (parts[1] === "jobs" ? parts[0] : null);
    const jobId = url.searchParams.get("token") ?? url.searchParams.get("gh_jid") ?? (parts[1] === "jobs" ? parts[2] : null);
    return board && jobId ? fetchGreenhouse(board, jobId) : null;
  }
  if (host.endsWith("lever.co") && parts.length >= 2) {
    return fetchLever(host, parts[0], parts[1]);
  }
  if (host === "jobs.smartrecruiters.com" && parts.length >= 2) {
    return fetchSmartRecruiters(parts[0], parts[1]);
  }
  if (host === "jobs.ashbyhq.com" && parts.length >= 2) {
    const board = await getAshbyBoard(parts[0]);
    return board.get(parts[1]) ?? null;
  }
  return null;
}

/**
 * Returns the company's own publish date for a job URL as Unix seconds, or
 * null if the board is unsupported or the lookup fails. Never throws.
 */
export async function getCompanyPostedDate(url: string): Promise<number | null> {
  if (!url) return null;

  const cached = dateCache.get(url);
  if (cached && cached.expires > Date.now()) return cached.value;

  let pending = inFlight.get(url);
  if (!pending) {
    pending = lookup(url)
      .catch(() => null)
      .then((value) => {
        dateCache.set(url, {
          value,
          expires: Date.now() + (value ? DATE_TTL_MS : MISS_TTL_MS),
        });
        return value;
      })
      .finally(() => inFlight.delete(url));
    inFlight.set(url, pending);
  }
  return pending;
}
