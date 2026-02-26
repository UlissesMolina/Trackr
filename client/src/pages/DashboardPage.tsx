import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useDashboardStats, useDashboardChart } from "../hooks/useDashboard";
import { useApplications } from "../hooks/useApplications";
import StatsCards from "../components/dashboard/StatsCards";
import ApplicationsChart from "../components/dashboard/ApplicationsChart";
import StatusBadge from "../components/applications/StatusBadge";
import EmptyState from "../components/ui/EmptyState";
import { formatDate, formatRelativeDateTime } from "../lib/utils";
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
      .slice(0, 5);
  }, [applications]);

  const upcomingItems = useMemo(() => getUpcomingItems(applications), [applications]);

  return (
    <div>
      {/* Header with greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>

      {/* Stats cards */}
      {statsLoading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border-default bg-surface-secondary" />
          ))}
        </div>
      ) : stats ? (
        <div className="mb-6">
          <StatsCards stats={stats} />
        </div>
      ) : null}

      {/* Recent Applications */}
      <div className="mb-6 rounded-xl border border-border-default bg-surface-secondary p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Recently visited
        </h2>

        {appsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-tertiary" />
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
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Add application
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-border-default">
            {recentApps.map((app) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="flex flex-col gap-1 py-3 transition-colors hover:bg-surface-tertiary sm:flex-row sm:items-center sm:justify-between sm:gap-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{app.title}</p>
                  <p className="truncate text-sm text-text-secondary">{app.company}</p>
                </div>
                <div className="flex items-center gap-3 sm:ml-4">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-text-tertiary">
                    {formatDate(app.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="mb-6">
        {chartLoading ? (
          <div className="h-[364px] animate-pulse rounded-xl border border-border-default bg-surface-secondary" />
        ) : (
          <ApplicationsChart data={chartData ?? []} days={7} />
        )}
      </div>

      {/* Upcoming — separate section below */}
      <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Upcoming
        </h2>
        <p className="mb-4 text-xs text-text-tertiary">
          Interviews and follow-ups in the next 7 days
        </p>
        {upcomingItems.length > 0 ? (
          <div className="space-y-2">
            {upcomingItems.map((item) => (
              <Link
                key={
                  item.type === "interview" && item.interview
                    ? item.interview.id
                    : `${item.app.id}-followup`
                }
                to={`/applications/${item.app.id}`}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-tertiary"
              >
                <span className="min-w-0 truncate text-sm text-text-primary">
                  {item.label}
                </span>
                {item.isOverdue && (
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-red-400 bg-red-500/20">
                    Overdue
                  </span>
                )}
                {item.isApproaching && !item.isOverdue && (
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-amber-400 bg-amber-500/20">
                    Due soon
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">
            No interviews or follow-ups in the next 7 days. Add interviews or follow-up dates on your applications to see them here.
          </p>
        )}
      </div>
    </div>
  );
}
