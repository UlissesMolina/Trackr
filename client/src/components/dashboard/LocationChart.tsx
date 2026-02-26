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
      .slice(0, 10);
  }, [applications]);

  if (data.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-border-default bg-surface-secondary">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary text-text-tertiary">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text-secondary">No location data yet</p>
        <p className="text-xs text-text-tertiary">Add location to your applications to see the breakdown</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        Applications by Location
      </h2>
      <p className="mb-4 text-xs text-text-tertiary">
        Top locations from your applications — useful for diversifying your search
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-text-tertiary)" }} />
          <YAxis
            type="category"
            dataKey="location"
            width={100}
            tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }}
            tickFormatter={(v) => (v.length > 18 ? v.slice(0, 16) + "…" : v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface-tertiary)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "8px",
              color: "var(--color-text-primary)",
            }}
            labelStyle={{ color: "var(--color-text-secondary)" }}
            formatter={(value: number | undefined) => [value ?? 0, "Applications"]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="count" fill="var(--color-accent)" radius={[0, 4, 4, 0]} name="Applications" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
