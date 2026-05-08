import { useState, useEffect, useMemo, useRef } from "react";
import { useJobs, type JobListing } from "../hooks/useJobs";
import { normalizeForDedup } from "../lib/utils";
import { useCreateApplication, useApplications } from "../hooks/useApplications";
import { useAuth } from "@clerk/clerk-react";
import EmptyState from "../components/ui/EmptyState";

const CSV_DAY_OPTIONS = [
  { value: 1, label: "Last 1 day" },
  { value: 3, label: "Last 3 days" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

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

/* ── Initials + color (same system as dashboard) ──────────────── */
const PALETTE = [
  { bg: "rgba(139, 92, 246, 0.12)", text: "#a78bfa" },
  { bg: "rgba(96, 165, 250, 0.12)", text: "#93b5e1" },
  { bg: "rgba(251, 191, 36, 0.12)", text: "#fbbf24" },
  { bg: "rgba(244, 114, 182, 0.12)", text: "#f472b6" },
  { bg: "rgba(74, 222, 128, 0.12)", text: "#6ee7a0" },
  { bg: "rgba(248, 113, 113, 0.12)", text: "#f87171" },
  { bg: "rgba(147, 181, 225, 0.12)", text: "#93b5e1" },
  { bg: "rgba(167, 139, 250, 0.12)", text: "#a78bfa" },
];

function getInitial(company: string): string {
  return (company[0] ?? "?").toUpperCase();
}

function getCompanyColor(company: string) {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

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

const INPUT_CLS =
  "rounded-lg border px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

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
  const color = getCompanyColor(job.company_name);
  const initial = getInitial(job.company_name);

  return (
    <div className="flex items-center gap-3.5 px-1 py-3.5 sm:gap-4">
      {/* Company initial circle */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {initial}
      </div>

      {/* Text block */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-medium text-text-primary">{job.title}</h3>
          {postedAgo && (
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium bg-surface-elevated text-text-tertiary">
              {postedAgo}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[13px]">
          <span className="text-text-secondary">{job.company_name}</span>
          {locationLabel && (
            <span className="text-text-tertiary"> · {locationLabel}</span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary"
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
              ? "cursor-default border border-border-default text-text-tertiary"
              : "border border-border-default text-text-secondary hover:border-text-tertiary hover:text-text-primary disabled:opacity-50"
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
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);
  const csvRef = useRef<HTMLDivElement>(null);
  const createMutation = useCreateApplication();
  const { data: applications } = useApplications();
  const { getToken } = useAuth();

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
      for (const k of normalizeForDedup(app.company ?? "", app.title ?? "")) set.add(k);
      if (app.url) set.add(app.url);
    }
    return set;
  }, [applications]);

  function isJobTracked(job: JobListing): boolean {
    const jobKeys = normalizeForDedup(job.company_name ?? "", job.title ?? "");
    if (jobKeys.some((k) => trackedKeys.has(k))) return true;
    if (job.url && trackedKeys.has(job.url)) return true;
    return false;
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (csvRef.current && !csvRef.current.contains(e.target as Node)) {
        setCsvOpen(false);
      }
    }
    if (csvOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [csvOpen]);

  async function handleCsvExport(days: number) {
    setCsvExporting(true);
    setCsvOpen(false);
    try {
      const token = await getToken();
      const res = await fetch(`/api/jobs/export/csv?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobs-last-${days}-days.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export CSV. Please try again.");
    } finally {
      setCsvExporting(false);
    }
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
    <div className="mx-auto max-w-4xl pt-2">
      <div className="mb-8 flex items-start justify-between">
        <div>
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
        <div className="relative" ref={csvRef}>
          <button
            onClick={() => setCsvOpen((o) => !o)}
            disabled={csvExporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-text-tertiary hover:text-text-primary disabled:opacity-50"
            style={{ backgroundColor: "var(--color-sidebar-bg)" }}
          >
            {csvExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" />
                Exporting…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </>
            )}
          </button>
          {csvOpen && (
            <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-border-default bg-surface-secondary py-1 shadow-lg">
              {CSV_DAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleCsvExport(opt.value)}
                  className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-elevated"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Search company, role, or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${INPUT_CLS} min-w-0 flex-1 sm:min-w-[200px]`}
          style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={INPUT_CLS}
          style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
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
          className={INPUT_CLS}
          style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
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
          className={INPUT_CLS}
          style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
        >
          {POSTED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label
          className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm text-text-primary"
          style={{ backgroundColor: "var(--color-sidebar-bg)", borderColor: "var(--color-sidebar-border)" }}
        >
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
          <div className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
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
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle pt-6">
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
