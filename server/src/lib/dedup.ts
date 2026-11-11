// Mirrors client/src/lib/utils.ts normalizeForDedup so the extension lookup,
// Gmail sync and the Job Finder all agree on what counts as the same job.

export function normalizeCompany(company: string): string {
  return (company ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s*(inc\.?|llc|corp\.?|corporation|ltd\.?|co\.?|plc|technologies|technology|labs)\s*$/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTitle(title: string): string {
  return (title ?? "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, " ");
}

export function normalizeForDedup(company: string, title: string): string[] {
  const c = normalizeCompany(company);
  const t = normalizeTitle(title);
  const keys = [`${c}|${t}`];
  if (t) {
    const core = t.replace(/\s*[-–—]\s*.*$/, "").replace(/\s*\(.*\)$/, "").trim();
    if (core && core !== t) keys.push(`${c}|${core}`);
  }
  return keys;
}

/** True when two normalized company names refer to the same employer. */
export function companiesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // "stripe" vs "stripe payments"; require a few characters so "ab" can't match everything
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 4 && (long.startsWith(short + " ") || long.endsWith(" " + short) || long.includes(" " + short + " "));
}

export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.hash = "";
    // Tracking params never identify a posting
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|gh_src|lever-|src|source|ref|trk)/i.test(key)) u.searchParams.delete(key);
    }
    return u.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}
