import { useState, useEffect, useMemo } from "react";
import { useJobs, type JobListing } from "../hooks/useJobs";
import { useCreateApplication, useApplications } from "../hooks/useApplications";
import EmptyState from "../components/ui/EmptyState";

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "software", label: "Software Engineering" },
  { value: "product", label: "Product Management" },
  { value: "ai", label: "Data Science & AI/ML" },
  { value: "quant", label: "Quantitative Finance" },
  { value: "hardware", label: "Hardware Engineering" },
];

const ROLE_TYPES = [
  { value: "", label: "All roles" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Full Stack" },
  { value: "data", label: "Data / Analytics" },
];

const POSTED_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const PAGE_SIZE = 25;

function formatPostedAgo(datePosted: number): string {
  if (!datePosted) return "";
  const now = Math.floor(Date.now() / 1000);
  const diffSec = now - datePosted;
  const days = Math.floor(diffSec / 86400);
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function JobCard({
  job,
  onAdd,
  isAdding,
  isTracked,
}: {
  job: JobListing;
  onAdd: () => void;
  isAdding: boolean;
  isTracked: boolean;
}) {
  const locationLabel =
    job.locations?.length > 1
      ? `${job.locations.length} locations`
      : job.locations?.[0] ?? null;
  const postedAgo = formatPostedAgo(job.date_posted ?? 0);

  return (
    <div className="rounded-lg border border-border-default bg-surface-secondary p-4 transition-colors hover:border-border-subtle">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium text-text-primary">{job.title}</h3>
            {postedAgo && (
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                  postedAgo === "Today"
                    ? "bg-accent/20 text-accent"
                    : postedAgo === "1d ago"
                      ? "bg-accent/15 text-accent"
                      : "bg-surface-elevated text-text-tertiary"
                }`}
              >
                {postedAgo}
              </span>
            )}
          </div>
          <p className="truncate text-sm text-text-secondary">{job.company_name}</p>
          {locationLabel && (
            <p className="mt-0.5 text-xs text-text-tertiary">{locationLabel}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20 hover:border-accent"
            >
              Apply
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          <button
            onClick={onAdd}
            disabled={isAdding || isTracked}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isTracked
                ? "cursor-default border border-border-default bg-surface-secondary text-text-tertiary"
                : "bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
            }`}
          >
            {isTracked ? (
              <>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Added
              </>
            ) : isAdding ? (
              "Adding…"
            ) : (
              "Add to Trackr"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobFinderPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [roleType, setRoleType] = useState("");
  const [usOnly, setUsOnly] = useState(false);
  const [postedWithin, setPostedWithin] = useState<"7d" | "14d" | "30d" | "all">("14d");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addingJobId, setAddingJobId] = useState<string | null>(null);
  const createMutation = useCreateApplication();
  const { data: applications } = useApplications();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, roleType, usOnly, postedWithin]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const { data, isLoading, error } = useJobs({
    search: debouncedSearch || undefined,
    category: category || undefined,
    roleType: roleType || undefined,
    usOnly: usOnly || undefined,
    postedWithin,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const trackedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const app of applications ?? []) {
      const key = `${(app.company ?? "").toLowerCase().trim()}|${(app.title ?? "").toLowerCase().trim()}`;
      set.add(key);
      if (app.url) set.add(app.url);
    }
    return set;
  }, [applications]);

  function isJobTracked(job: JobListing): boolean {
    const companyTitleKey = `${(job.company_name ?? "").toLowerCase().trim()}|${(job.title ?? "").toLowerCase().trim()}`;
    return trackedKeys.has(companyTitleKey) || (!!job.url && trackedKeys.has(job.url));
  }

  function handleAdd(job: JobListing) {
    setAddingJobId(job.id);
    createMutation.mutate(
      {
        title: job.title,
        company: job.company_name,
        location: job.locations?.join(", ") ?? undefined,
        url: job.url || undefined,
        status: "SAVED",
      },
      {
        onSettled: () => setAddingJobId(null),
      }
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Job Finder
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Summer 2026 tech internships from{" "}
          <a
            href="https://github.com/SimplifyJobs/Summer2026-Internships"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            SimplifyJobs/Summer2026-Internships
          </a>
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search company, role, or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:min-w-[200px]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={roleType}
          onChange={(e) => setRoleType(e.target.value)}
          className="rounded-lg border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {ROLE_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={postedWithin}
          onChange={(e) => setPostedWithin(e.target.value as "7d" | "14d" | "30d" | "all")}
          className="rounded-lg border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {POSTED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={usOnly}
            onChange={(e) => setUsOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
          />
          US only
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          Failed to load jobs. The GitHub repo may be temporarily unavailable.
        </div>
      )}

      {data && data.jobs.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-12 w-12 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          headline="No matches"
          description="Try a different search or category."
        />
      )}

      {data && data.jobs.length > 0 && (
        <>
          <p className="mb-4 text-sm text-text-tertiary">
            {data.total} internship{data.total !== 1 ? "s" : ""} found · sorted by newest
          </p>
          <div className="space-y-3">
            {data.jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAdd={() => handleAdd(job)}
                isAdding={addingJobId === job.id}
                isTracked={isJobTracked(job)}
              />
            ))}
          </div>

          {data.total > PAGE_SIZE && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border-default pt-6">
              <p className="text-sm text-text-tertiary">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border-default px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated disabled:pointer-events-none disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-text-tertiary">
                  Page {page} of {Math.ceil(data.total / PAGE_SIZE)}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(Math.ceil(data.total / PAGE_SIZE), p + 1))}
                  disabled={page >= Math.ceil(data.total / PAGE_SIZE)}
                  className="rounded-lg border border-border-default px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated disabled:pointer-events-none disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
