import type { DashboardStats } from "../../types";

interface StatsCardsProps {
  stats: DashboardStats;
}

const CARDS: Array<{
  label: string;
  getValue: (stats: DashboardStats) => string;
  getSubtitle: (stats: DashboardStats) => string;
}> = [
  {
    label: "Applied",
    getValue: (s) => String(s.appliedCount),
    getSubtitle: (s) =>
      [`${s.applicationsThisWeek} this week`, s.savedCount > 0 ? `${s.savedCount} saved` : null]
        .filter(Boolean)
        .join(" · "),
  },
  {
    label: "Interview Rate",
    getValue: (s) => `${s.interviewRate}%`,
    getSubtitle: (s) => `${s.interviewedCount} of ${s.appliedCount} applied`,
  },
  {
    label: "Rejection Rate",
    getValue: (s) => `${s.rejectionRate}%`,
    getSubtitle: (s) => `${s.rejectedCount} of ${s.appliedCount} applied`,
  },
  {
    label: "Offers",
    getValue: (s) => String(s.offersCount),
    getSubtitle: (s) =>
      s.interviewedCount > 0
        ? `${s.offersCount} of ${s.interviewedCount} interviewed`
        : "No interviews yet",
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CARDS.map(({ label, getValue, getSubtitle }) => {
        const display = getValue(stats);
        const subtitle = getSubtitle(stats);
        return (
          <div
            key={label}
            className="stat-tile rounded-[10px] bg-surface-tertiary p-4 transition-colors hover:bg-surface-elevated"
          >
            <p className="stat-label text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              {label}
            </p>
            <p className="stat-number mt-1 font-display text-2xl font-semibold text-text-primary">{display}</p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
