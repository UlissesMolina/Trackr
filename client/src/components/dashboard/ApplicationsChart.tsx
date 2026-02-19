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
}

export default function ApplicationsChart({ data }: ApplicationsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border-default bg-surface-secondary">
        <p className="text-sm text-text-tertiary">No application data to chart yet.</p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        Applications Over Time
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e2e35" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#5c5c69" }} stroke="#2e2e35" />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5c5c69" }} stroke="#2e2e35" />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1a1f", border: "1px solid #2e2e35", borderRadius: "8px", color: "#ededef" }}
            labelStyle={{ color: "#8a8a96" }}
          />
          <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#colorCount)" name="Applications" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
