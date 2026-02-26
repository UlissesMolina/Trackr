import type { DashboardStats } from "../../types";

interface StatsCardsProps {
  stats: DashboardStats;
}

const CARDS: Array<{
  key: keyof DashboardStats;
  label: string;
  suffix: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  getSubtitle: (stats: DashboardStats) => string;
}> = [
  {
    key: "totalApplications",
    label: "Total Applications",
    suffix: "",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    iconBg: "bg-accent/20",
    iconColor: "text-accent",
    getSubtitle: (s) =>
      s.applicationsThisWeek != null
        ? `${s.applicationsThisWeek} this week`
        : "",
  },
  {
    key: "responseRate",
    label: "Response Rate",
    suffix: "%",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    getSubtitle: () => "Interview callbacks",
  },
  {
    key: "rejectionRate",
    label: "Rejection Rate",
    suffix: "%",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    getSubtitle: () => "Companies passed",
  },
  {
    key: "interviewConversion",
    label: "Interview Conversion",
    suffix: "%",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    getSubtitle: (s) => {
      if (s.interviewsCount != null && s.offersCount != null && (s.interviewsCount > 0 || s.offersCount > 0)) {
        return `${s.interviewsCount} interviews · ${s.offersCount} offers`;
      }
      return "No interviews yet";
    },
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ key, label, suffix, icon, iconBg, iconColor, getSubtitle }) => {
        const value = stats[key] as number | undefined;
        const display = `${value ?? 0}${suffix}`;
        const subtitle = getSubtitle(stats);
        return (
          <div key={key} className="rounded-xl border border-border-default bg-surface-secondary p-5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
              {icon}
            </div>
            <p className="mt-3 text-3xl font-bold text-text-primary">{display}</p>
            <p className="mt-0.5 text-sm font-medium text-text-secondary">{label}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-text-tertiary">{subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
