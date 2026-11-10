import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ChartDataPoint } from "../../hooks/useDashboard";

export const CHART_RANGES = [
  { days: 7, label: "7d", title: "Last 7 days" },
  { days: 30, label: "30d", title: "Last 30 days" },
  { days: 90, label: "3m", title: "Last 3 months" },
  { days: 180, label: "6m", title: "Last 6 months" },
] as const;

interface ApplicationsChartProps {
  data: ChartDataPoint[];
  days?: number;
  onDaysChange?: (days: number) => void;
  loading?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Server buckets by UTC date (YYYY-MM-DD) and omits empty days; fill the gaps
// and, for long ranges, roll days up into weekly buckets so the line stays readable.
function buildSeries(data: ChartDataPoint[], days: number) {
  const counts = new Map(data.map((d) => [d.date, d.count]));
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const bucketSize = days > 30 ? 7 : 1;
  const series: { date: string; label: string; count: number }[] = [];

  for (let offset = days - 1; offset >= 0; offset -= bucketSize) {
    const start = todayUtc - offset * DAY_MS;
    let count = 0;
    for (let i = 0; i < bucketSize && offset - i >= 0; i++) {
      count += counts.get(new Date(start + i * DAY_MS).toISOString().slice(0, 10)) ?? 0;
    }
    series.push({
      date: new Date(start).toISOString().slice(0, 10),
      label: new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      count,
    });
  }
  return series;
}

export default function ApplicationsChart({ data, days = 7, onDaysChange, loading }: ApplicationsChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  const range = CHART_RANGES.find((r) => r.days === days);
  const formatted = buildSeries(safeData, days);
  const total = safeData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-text-secondary">
          Applications — {range?.title ?? `Last ${days} days`}
          {!loading && <span className="ml-1.5 text-text-tertiary">· {total}</span>}
        </p>
        {onDaysChange && (
          <div className="flex rounded-md border border-border-subtle p-0.5">
            {CHART_RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => onDaysChange(r.days)}
                aria-pressed={r.days === days}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  r.days === days
                    ? "bg-surface-tertiary text-text-primary"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {loading ? (
        <div className="h-[170px] animate-pulse rounded-lg bg-surface-tertiary" />
      ) : (
      <ResponsiveContainer width="100%" height={170}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" style={{ stopColor: "var(--color-chart-fill)" }} stopOpacity={1} />
              <stop offset="95%" style={{ stopColor: "var(--color-chart-fill)" }} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
          <XAxis dataKey="label" minTickGap={16} tick={{ fontSize: 11, fill: "var(--color-chart-tick)" }} stroke="var(--color-border-subtle)" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-chart-tick)" }} stroke="var(--color-border-subtle)" />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--color-tooltip-bg)", border: "1px solid var(--color-tooltip-border)", borderRadius: "8px", color: "var(--color-text-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
            labelStyle={{ color: "var(--color-text-tertiary)" }}
          />
          <Area type="monotone" dataKey="count" stroke="var(--color-chart-stroke)" strokeWidth={2} fill="url(#colorCount)" name={days > 30 ? "Applications (week)" : "Applications"} />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
