import { Link } from "react-router-dom";
import { useDashboardStats, useDashboardChart } from "../hooks/useDashboard";
import { useApplications } from "../hooks/useApplications";
import StatsCards from "../components/dashboard/StatsCards";
import ApplicationsChart from "../components/dashboard/ApplicationsChart";
import StatusBadge from "../components/applications/StatusBadge";
import { formatDate } from "../lib/utils";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useDashboardChart();
  const { data: applications = [], isLoading: appsLoading } = useApplications();

  const recentApps = applications.slice(0, 5);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <Link
          to="/board"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Go to Board
        </Link>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border-default bg-surface-secondary" />
          ))}
        </div>
      ) : stats ? (
        <StatsCards stats={stats} />
      ) : null}

      <div className="mt-6">
        {chartLoading ? (
          <div className="h-[364px] animate-pulse rounded-xl border border-border-default bg-surface-secondary" />
        ) : (
          <ApplicationsChart data={chartData ?? []} />
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border-default bg-surface-secondary p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Recent Applications
        </h2>

        {appsLoading ? (
          <p className="text-sm text-text-tertiary">Loading...</p>
        ) : recentApps.length === 0 ? (
          <p className="text-sm text-text-tertiary">
            No applications yet.{" "}
            <Link to="/board" className="text-accent hover:underline">Add your first one</Link>
          </p>
        ) : (
          <div className="divide-y divide-border-default">
            {recentApps.map((app) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="flex items-center justify-between py-3 transition-colors hover:bg-surface-tertiary"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{app.title}</p>
                  <p className="truncate text-sm text-text-secondary">{app.company}</p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <StatusBadge status={app.status} />
                  {app.dateApplied && (
                    <span className="text-xs text-text-tertiary">{formatDate(app.dateApplied)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
