const LISTINGS_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json";

const HIRING_CAFE_API = "https://hiring.cafe/api/search-jobs";

export type JobSource = "simplify" | "hiringcafe";

export interface JobListing {
  id: string;
  company_name: string;
  company_url: string;
  title: string;
  url: string;
  locations: string[];
  terms: string[];
  date_posted: number;
  active: boolean;
  is_visible?: boolean;
  source: string;
  category?: string;
}

let cachedListings: JobListing[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchListings(): Promise<JobListing[]> {
  if (cachedListings && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedListings;
  }
  const res = await fetch(LISTINGS_URL);
  if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid listings format");
  }
  cachedListings = data as JobListing[];
  cacheTime = Date.now();
  return cachedListings;
}

function isSummer2026(listing: JobListing): boolean {
  return listing.terms?.some((t) => t.includes("Summer 2026")) ?? false;
}

export interface GroupedJob {
  id: string;
  company_name: string;
  company_url: string;
  title: string;
  url: string;
  locations: string[];
  date_posted: number;
  category?: string;
}

function groupByCompanyAndTitle(listings: JobListing[]): GroupedJob[] {
  const map = new Map<string, JobListing[]>();
  for (const l of listings) {
    const key = `${(l.company_name ?? "").toLowerCase().trim()}|${(l.title ?? "").toLowerCase().trim()}`;
    const existing = map.get(key) ?? [];
    existing.push(l);
    map.set(key, existing);
  }
  const result: GroupedJob[] = [];
  for (const [, group] of map) {
    const first = group[0];
    const locations = [...new Set(group.flatMap((g) => g.locations ?? []))].filter(Boolean).sort();
    const latestDate = Math.max(...group.map((g) => g.date_posted ?? 0));
    result.push({
      id: first.id,
      company_name: first.company_name,
      company_url: first.company_url,
      title: first.title,
      url: first.url,
      locations,
      date_posted: latestDate,
      category: first.category,
    });
  }
  return result;
}

function matchesCategory(listing: JobListing, category: string): boolean {
  const cat = (listing.category ?? "").toLowerCase();
  const q = category.toLowerCase();
  if (q === "software" || q === "software engineering") {
    return (
      cat.includes("software") ||
      cat === "software" ||
      cat === "software engineering"
    );
  }
  if (q === "product" || q === "product management") {
    return cat.includes("product");
  }
  if (q === "ai" || q === "data" || q.includes("data science") || q.includes("ai/ml")) {
    return (
      cat.includes("ai") ||
      cat.includes("data") ||
      cat.includes("ml") ||
      cat.includes("machine learning")
    );
  }
  if (q === "quant" || q.includes("quantitative")) {
    return cat.includes("quant");
  }
  if (q === "hardware") {
    return cat.includes("hardware");
  }
  return true;
}

const US_STATE_CODES = /\b(AK|AL|AR|AZ|CA|CO|CT|DC|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b/;
const NON_US_PATTERNS = [
  "canada", "ontario", "toronto", "vancouver", "montreal", "calgary", "quebec",
  "british columbia", ", on", ", bc", ", ab", ", qc", ", ns", ", nb", ", mb", ", sk",
  "united kingdom", ", uk", "london", "manchester", "edinburgh", "birmingham", "cambridge, uk",
  "remote - canada", "remote - uk", "remote (canada)", "remote (uk)",
  "germany", "france", "netherlands", "australia", "india", "singapore",
];

function isUSLocation(loc: string): boolean {
  const lower = loc.toLowerCase();
  if (NON_US_PATTERNS.some((p) => lower.includes(p))) return false;
  if (US_STATE_CODES.test(loc)) return true;
  if (lower.includes("usa") || lower.includes("united states") || lower.includes("remote in usa")) return true;
  if (/\b,?\s*us\b/.test(lower)) return true;
  if (lower === "remote" || lower.includes("remote - us") || lower.includes("remote us")) return true;
  return false;
}

function hasUSLocation(locations: string[]): boolean {
  if (!locations?.length) return true;
  return locations.some((loc) => isUSLocation(loc));
}

function matchesRoleType(listing: JobListing, roleType: string): boolean {
  const title = (listing.title ?? "").toLowerCase();
  const q = roleType.toLowerCase();
  if (q === "frontend") {
    return (
      title.includes("frontend") ||
      title.includes("front-end") ||
      title.includes("front end") ||
      title.includes("ui") ||
      title.includes("front end") ||
      title.includes("ui/ux") ||
      title.includes("react") ||
      title.includes("front-end engineer")
    );
  }
  if (q === "backend") {
    return (
      title.includes("backend") ||
      title.includes("back-end") ||
      title.includes("back end") ||
      title.includes("server") ||
      title.includes("api") ||
      title.includes("infrastructure") ||
      title.includes("platform") ||
      title.includes("systems engineer")
    );
  }
  if (q === "fullstack" || q === "full stack") {
    return (
      title.includes("full stack") ||
      title.includes("fullstack") ||
      title.includes("full-stack")
    );
  }
  if (q === "data") {
    return (
      title.includes("data") ||
      title.includes("analytics") ||
      title.includes("machine learning") ||
      title.includes("ml") ||
      title.includes("ai") ||
      title.includes("research")
    );
  }
  return true;
}

// --- Hiring.Cafe API ---

interface HiringCafeJobInfo {
  title?: string;
  description?: string;
}

interface HiringCafeProcessedData {
  company_name?: string;
  formatted_workplace_location?: string;
  estimated_publish_date_millis?: number;
  job_category?: string;
  workplace_type?: string;
}

interface HiringCafeJob {
  id?: string;
  apply_url?: string;
  job_information?: HiringCafeJobInfo;
  v5_processed_job_data?: HiringCafeProcessedData;
}

interface HiringCafeResponse {
  jobs?: HiringCafeJob[];
  total?: number;
  totalElements?: number;
  total_count?: number;
}

async function searchHiringCafeAPI(options: {
  search?: string;
  category?: string;
  roleType?: string;
  limit: number;
  offset: number;
}): Promise<HiringCafeResponse> {
  const { search, category, roleType, limit, offset } = options;
  const searchState: Record<string, unknown> = {
    roleTypes: ["Individual Contributor"],
  };
  let query = search?.trim() ?? "";
  if (category) {
    const c = category.toLowerCase();
    if (c === "software") query = (query ? `${query} ` : "") + "software engineer";
    else if (c === "product") query = (query ? `${query} ` : "") + "product manager";
    else if (c === "ai") query = (query ? `${query} ` : "") + "machine learning engineer";
  }
  if (roleType) {
    const q = roleType.toLowerCase();
    if (q === "frontend") query = (query ? `${query} ` : "") + "frontend engineer";
    else if (q === "backend") query = (query ? `${query} ` : "") + "backend engineer";
    else if (q === "fullstack") query = (query ? `${query} ` : "") + "full stack engineer";
    else if (q === "data") query = (query ? `${query} ` : "") + "data engineer";
  }
  if (query) searchState.jobTitleQuery = query;
  const page = limit > 0 ? Math.floor(offset / limit) : 0;
  const body = {
    size: Math.min(limit, 50),
    page,
    searchState,
  };
  const res = await fetch(HIRING_CAFE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Trackr/1.0 (Job Search App)",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Hiring.Cafe API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<HiringCafeResponse>;
}

function mapHiringCafeToGroupedJob(j: HiringCafeJob, index: number): GroupedJob {
  const info = j.job_information;
  const data = j.v5_processed_job_data;
  const title = info?.title ?? "Software Engineer";
  const company = data?.company_name ?? "Unknown";
  const url = j.apply_url ?? "";
  const locations = data?.formatted_workplace_location
    ? [data.formatted_workplace_location]
    : data?.workplace_type
      ? [data.workplace_type]
      : [];
  const datePosted = data?.estimated_publish_date_millis
    ? Math.floor(data.estimated_publish_date_millis / 1000)
    : Math.floor(Date.now() / 1000);
  const id = j.id ?? `hc-${index}-${Date.now()}`;
  return {
    id,
    company_name: company,
    company_url: "",
    title,
    url,
    locations,
    date_posted: datePosted,
    category: data?.job_category,
  };
}

async function searchHiringCafeJobs(options: {
  search?: string;
  category?: string;
  roleType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ jobs: GroupedJob[]; total: number }> {
  const { search, category, roleType, limit = 50, offset = 0 } = options;
  const page = Math.floor(offset / limit);

  const res = await searchHiringCafeAPI({
    search,
    category,
    roleType,
    limit,
    offset: page * limit,
  });

  const rawJobs = res.jobs ?? (Array.isArray(res) ? res : []);
  const jobs = rawJobs.map((j, i) => mapHiringCafeToGroupedJob(j as HiringCafeJob, i));

  const total = res.total ?? res.totalElements ?? res.total_count ?? jobs.length;

  return {
    jobs,
    total,
  };
}

// --- Simplify Jobs (existing) ---

export async function searchJobs(options: {
  source?: JobSource;
  category?: string;
  roleType?: string;
  search?: string;
  usOnly?: boolean;
  postedWithin?: "7d" | "14d" | "30d" | "all";
  limit?: number;
  offset?: number;
}): Promise<{ jobs: GroupedJob[]; total: number }> {
  const { source = "simplify", ...rest } = options;

  if (source === "hiringcafe") {
    return searchHiringCafeJobs({
      search: rest.search,
      category: rest.category,
      roleType: rest.roleType,
      limit: rest.limit,
      offset: rest.offset,
    });
  }

  const { category, roleType, search, usOnly, postedWithin = "14d", limit = 50, offset = 0 } = rest;
  const all = await fetchListings();

  let filtered = all.filter(
    (l) =>
      l.active &&
      l.is_visible !== false &&
      isSummer2026(l)
  );

  if (category) {
    filtered = filtered.filter((l) => matchesCategory(l, category));
  }

  if (roleType) {
    filtered = filtered.filter((l) => matchesRoleType(l, roleType));
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        (l.company_name ?? "").toLowerCase().includes(q) ||
        (l.title ?? "").toLowerCase().includes(q) ||
        (l.locations ?? []).some((loc) => loc.toLowerCase().includes(q))
    );
  }

  let grouped = groupByCompanyAndTitle(filtered);
  if (usOnly) {
    grouped = grouped.filter((g) => hasUSLocation(g.locations ?? []));
  }
  if (postedWithin && postedWithin !== "all") {
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - { "7d": 7, "14d": 14, "30d": 30 }[postedWithin] * 86400;
    grouped = grouped.filter((g) => (g.date_posted ?? 0) >= cutoff);
  }
  grouped.sort((a, b) => (b.date_posted ?? 0) - (a.date_posted ?? 0));

  const total = grouped.length;
  const jobs = grouped.slice(offset, offset + limit);
  return { jobs, total };
}
