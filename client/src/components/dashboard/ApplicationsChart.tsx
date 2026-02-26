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

interface ApplicationsChartProps {
  data: ChartDataPoint[];
  days?: number;
}

export default function ApplicationsChart({ data, days = 7 }: ApplicationsChartProps) {
  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border-default bg-surface-secondary">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary text-text-tertiary">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text-secondary">No data yet</p>
        <p className="text-xs text-text-tertiary">Apply to jobs to see your progress over time</p>
      </div>
    );
  }

  const formatted = safeData.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        Applications — Last {days} days
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e2e35" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5c5c69" }} stroke="#2e2e35" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5c5c69" }} stroke="#2e2e35" />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a1f", border: "1px solid #2e2e35", borderRadius: "8px", color: "#ededef" }}
            labelStyle={{ color: "#8a8a96" }}
          />
          <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#colorCount)" name="Applications" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
