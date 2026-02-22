import type { DashboardStats } from "../../types";

interface StatsCardsProps {
  stats: DashboardStats;
}

const CARDS = [
  { key: "totalApplications" as const, label: "Total Applications", suffix: "" },
  { key: "responseRate" as const, label: "Response Rate", suffix: "%" },
  { key: "rejectionRate" as const, label: "Rejection Rate", suffix: "%" },
  { key: "interviewConversion" as const, label: "Interview Conversion", suffix: "%", zeroLabel: "No interviews yet" },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ key, label, suffix, zeroLabel }) => {
        const value = stats[key];
        const display =
          zeroLabel !== undefined && value === 0 ? zeroLabel : `${value}${suffix}`;
        return (
          <div key={key} className="rounded-xl border border-border-default bg-surface-secondary p-6">
            <p className="text-sm font-medium text-text-secondary">{label}</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {display}
            </p>
          </div>
        );
      })}
    </div>
  );
}
