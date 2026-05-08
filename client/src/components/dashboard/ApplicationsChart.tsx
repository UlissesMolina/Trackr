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
      <div className="py-6 text-center">
        <p className="text-[13px] text-text-tertiary">No chart data yet</p>
      </div>
    );
  }

  const formatted = safeData.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-text-secondary">
        Applications — Last {days} days
      </p>
      <ResponsiveContainer width="100%" height={170}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(124, 138, 255, 0.25)" stopOpacity={1} />
              <stop offset="95%" stopColor="rgba(124, 138, 255, 0.25)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-chart-tick)" }} stroke="var(--color-border-subtle)" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-chart-tick)" }} stroke="var(--color-border-subtle)" />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--color-tooltip-bg)", border: "1px solid var(--color-tooltip-border)", borderRadius: "8px", color: "var(--color-text-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
            labelStyle={{ color: "var(--color-text-tertiary)" }}
          />
          <Area type="monotone" dataKey="count" stroke="rgba(124, 138, 255, 0.6)" strokeWidth={2} fill="url(#colorCount)" name="Applications" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
