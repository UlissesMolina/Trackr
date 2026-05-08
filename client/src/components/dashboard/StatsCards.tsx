import type { DashboardStats } from "../../types";

interface StatsCardsProps {
  stats: DashboardStats;
}

const CARDS: Array<{
  key: keyof DashboardStats;
  label: string;
  suffix: string;
  getSubtitle: (stats: DashboardStats) => string;
}> = [
  {
    key: "totalApplications",
    label: "Total Apps",
    suffix: "",
    getSubtitle: (s) =>
      s.applicationsThisWeek != null
        ? `${s.applicationsThisWeek} this week`
        : "",
  },
  {
    key: "responseRate",
    label: "Response Rate",
    suffix: "%",
    getSubtitle: () => "Callbacks",
  },
  {
    key: "rejectionRate",
    label: "Rejection Rate",
    suffix: "%",
    getSubtitle: () => "Passed",
  },
  {
    key: "interviewConversion",
    label: "Conversion",
    suffix: "%",
    getSubtitle: (s) => {
      if (s.interviewsCount != null && s.offersCount != null && (s.interviewsCount > 0 || s.offersCount > 0)) {
        return `${s.interviewsCount} int · ${s.offersCount} offers`;
      }
      return "No interviews";
    },
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CARDS.map(({ key, label, suffix, getSubtitle }) => {
        const value = stats[key] as number | undefined;
        const display = `${value ?? 0}${suffix}`;
        const subtitle = getSubtitle(stats);
        return (
          <div
            key={key}
            className="rounded-[10px] bg-surface-tertiary p-4 transition-colors hover:bg-surface-elevated"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">{display}</p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
