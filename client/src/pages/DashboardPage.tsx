import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useDashboardStats, useDashboardChart } from "../hooks/useDashboard";
import { useApplications } from "../hooks/useApplications";
import StatsCards from "../components/dashboard/StatsCards";
import ApplicationsChart from "../components/dashboard/ApplicationsChart";
import LocationChart from "../components/dashboard/LocationChart";
import StatusBadge from "../components/applications/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import { formatRelativeDateTime } from "../lib/utils";
import { INTERVIEW_TYPE_LABELS } from "../lib/constants";
import type { Application, Interview } from "../types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getContextualSubtitle(
  applications: Application[],
  stats: { totalApplications: number; applicationsThisWeek?: number } | undefined
): string {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const followUpsDueThisWeek = applications.filter((app) => {
    if (!app.followUpDate) return false;
    const d = new Date(app.followUpDate);
    return d >= startOfWeek && d <= endOfWeek;
  }).length;

  const inFlight = applications.filter((a) => a.status !== "REJECTED").length;

  if (followUpsDueThisWeek > 0) {
    return `You have ${followUpsDueThisWeek} follow-up${followUpsDueThisWeek === 1 ? "" : "s"} due this week`;
  }
  if (inFlight > 0) {
    const total = stats?.totalApplications ?? inFlight;
    const thisWeek = stats?.applicationsThisWeek;
    if (thisWeek != null && total > 0) {
      return `${total} total · ${thisWeek} this week · Keep going`;
    }
    return `${inFlight} application${inFlight === 1 ? "" : "s"} · Keep going`;
  }
  if (stats && stats.totalApplications > 0) {
    return "Track your job search progress";
  }
  return "Add your first application to get started";
}

interface UpcomingItem {
  type: "interview" | "follow-up";
  date: Date;
  label: string;
  app: Application;
  interview?: Interview;
  isOverdue: boolean;
  isApproaching?: boolean;
}

function getUpcomingItems(applications: Application[]): UpcomingItem[] {
  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(now.getDate() + 7);
  const items: UpcomingItem[] = [];

  for (const app of applications) {
    if (app.interviews) {
      for (const int of app.interviews) {
        const scheduled = new Date(int.scheduledAt);
        if (scheduled >= now && scheduled <= in7Days) {
          items.push({
            type: "interview",
            date: scheduled,
            label: `${app.company} — ${INTERVIEW_TYPE_LABELS[int.type] ?? int.type} · ${formatRelativeDateTime(int.scheduledAt)}`,
            app,
            interview: int,
            isOverdue: false,
          });
        }
      }
    }
    if (app.followUpDate) {
      const d = new Date(app.followUpDate);
      if (d <= in7Days) {
        const rel = d >= now ? formatRelativeDateTime(app.followUpDate) : "Overdue";
        items.push({
          type: "follow-up",
          date: d,
          label: `${app.company} — Follow up · ${rel}`,
          app,
          isOverdue: d < now,
          isApproaching: d >= now && d.getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000,
        });
      }
    }
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime());
  return items.slice(0, 8);
}

/* ── Initials + color for activity feed ─────────────────────── */
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

function getInitials(company: string): string {
  return company
    .split(/[\s&]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getCompanyColor(company: string) {
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function formatRelativeShort(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

/* ── Quick action icons ─────────────────────────────────────── */
function PlusIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
function BoardIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}
function FlowIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}
function ResumeIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useDashboardChart();
  const { data: applications = [], isLoading: appsLoading } = useApplications();

  const firstName = user?.firstName ?? user?.username ?? "there";
  const greeting = getGreeting();
  const subtitle = useMemo(
    () => getContextualSubtitle(applications, stats),
    [applications, stats]
  );

  const recentApps = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 7);
  }, [applications]);

  const upcomingItems = useMemo(() => getUpcomingItems(applications), [applications]);

  return (
    <div>
      {/* ─── Greeting header (full width) ─────────────────────── */}
      <div className="mb-7">
        <h1 className="text-[26px] font-semibold text-text-primary">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1.5 text-[15px] text-text-secondary">
          Here&apos;s your application activity.
        </p>
        {subtitle && (
          <p className="mt-1 text-[13px] text-text-tertiary">
            {subtitle}
          </p>
        )}
      </div>

      {/* ─── Two-column layout ────────────────────────────────── */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">

        {/* ═══ LEFT COLUMN: Activity + Upcoming ═══ */}
        <div>
          {/* ── Recent activity ── */}
          <div>
            <p className="mb-3 text-[13px] font-medium text-text-secondary">
              Recent activity
            </p>

            {appsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-tertiary" />
                ))}
              </div>
            ) : recentApps.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                }
                headline="No applications yet"
                description="Add your first job application to start tracking your search."
                action={
                  <Link
                    to="/board"
                    className="inline-flex items-center gap-2 rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent"
                  >
                    Add application
                  </Link>
                }
              />
            ) : (
              <div>
                {recentApps.map((app, i) => {
                  const color = getCompanyColor(app.company);
                  const initials = getInitials(app.company);
                  return (
                    <Link
                      key={app.id}
                      to={`/applications/${app.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-tertiary"
                      style={{
                        borderBottom: i < recentApps.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                      }}
                    >
                      {/* Initials circle */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: color.bg,
                          color: color.text,
                        }}
                      >
                        {initials}
                      </div>

                      {/* Text block */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {app.title}
                        </p>
                        <p className="truncate text-[13px] text-text-tertiary">
                          {app.company} · {formatRelativeShort(app.updatedAt)}
                        </p>
                      </div>

                      {/* Status badge */}
                      <StatusBadge status={app.status} />
                    </Link>
                  );
                })}

                {/* View all link */}
                <Link
                  to="/board"
                  className="mt-3 inline-block text-[13px] text-text-tertiary no-underline transition-colors hover:text-text-secondary"
                >
                  View all activity →
                </Link>
              </div>
            )}
          </div>

          {/* ── Upcoming ── */}
          <div className="mt-8">
            <p className="mb-3 text-[13px] font-medium text-text-secondary">
              Upcoming
            </p>

            {upcomingItems.length > 0 ? (
              <div>
                {upcomingItems.map((item) => (
                  <Link
                    key={
                      item.type === "interview" && item.interview
                        ? item.interview.id
                        : `${item.app.id}-followup`
                    }
                    to={`/applications/${item.app.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-tertiary"
                  >
                    <span className="min-w-0 truncate text-sm text-text-secondary">
                      {item.label}
                    </span>
                    {item.isOverdue && (
                      <span className="shrink-0 rounded-full bg-red-500/12 px-2.5 py-0.5 text-xs font-medium text-red-400">
                        Overdue
                      </span>
                    )}
                    {item.isApproaching && !item.isOverdue && (
                      <span className="shrink-0 rounded-full bg-yellow-500/12 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                        Due soon
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[10px] bg-surface-tertiary p-5 text-center">
                <p className="text-sm text-text-tertiary">No upcoming interviews</p>
                <p className="mt-1 text-xs text-text-tertiary">
                  Add dates to your applications to see them here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT COLUMN: Stats + Charts ═══ */}
        <div>
          {/* ── Compact stat tiles (2×2) ── */}
          {statsLoading ? (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-[10px] bg-surface-tertiary" />
              ))}
            </div>
          ) : stats ? (
            <div className="mb-6">
              <StatsCards stats={stats} />
            </div>
          ) : null}

          {/* ── Charts ── */}
          <div>
            <div className="mb-5 border-t border-border-subtle pt-4">
              {chartLoading ? (
                <div className="h-[180px] animate-pulse rounded-lg bg-surface-tertiary" />
              ) : (
                <ApplicationsChart data={chartData ?? []} days={7} />
              )}
            </div>
            <div className="border-t border-border-subtle pt-4">
              <LocationChart applications={applications} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick actions bar (full width) ───────────────────── */}
      <div className="mt-8 border-t border-border-subtle pt-5">
        <div className="flex flex-wrap items-center gap-6">
          <Link
            to="/board"
            className="flex items-center gap-2 text-[13px] text-text-tertiary no-underline transition-colors hover:text-text-primary"
          >
            <PlusIcon /> Add application
          </Link>
          <Link
            to="/board"
            className="flex items-center gap-2 text-[13px] text-text-tertiary no-underline transition-colors hover:text-text-primary"
          >
            <BoardIcon /> View board
          </Link>
          <Link
            to="/flow"
            className="flex items-center gap-2 text-[13px] text-text-tertiary no-underline transition-colors hover:text-text-primary"
          >
            <FlowIcon /> Application flow
          </Link>
          <Link
            to="/resume"
            className="flex items-center gap-2 text-[13px] text-text-tertiary no-underline transition-colors hover:text-text-primary"
          >
            <ResumeIcon /> Resume
          </Link>
        </div>
      </div>
    </div>
  );
}
