import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Application } from "../../types";

interface LocationChartProps {
  applications: Application[];
}

function normalizeLocation(loc: string | null | undefined): string {
  const trimmed = loc?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unspecified";
}

export default function LocationChart({ applications }: LocationChartProps) {
  const data = useMemo(() => {
    const byLocation: Record<string, number> = {};
    for (const app of applications) {
      const loc = normalizeLocation(app.location);
      byLocation[loc] = (byLocation[loc] ?? 0) + 1;
    }
    return Object.entries(byLocation)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applications]);

  if (data.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-[13px] text-text-tertiary">No location data yet</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-text-secondary">
        Top locations
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-chart-tick)" }} stroke="var(--color-border-subtle)" />
          <YAxis
            type="category"
            dataKey="location"
            width={80}
            tick={{ fontSize: 11, fill: "var(--color-chart-tick)" }}
            tickFormatter={(v) => (v.length > 14 ? v.slice(0, 12) + "…" : v)}
            stroke="var(--color-border-subtle)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-tooltip-bg)",
              border: "1px solid var(--color-tooltip-border)",
              borderRadius: "8px",
              color: "var(--color-text-primary)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
            labelStyle={{ color: "var(--color-text-tertiary)" }}
            formatter={(value: number | undefined) => [value ?? 0, "Applications"]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="count" fill="rgba(96, 165, 250, 0.25)" radius={[0, 4, 4, 0]} name="Applications" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
