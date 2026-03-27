import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Application } from "../../types";
import StatusSelect from "./StatusSelect";
import PrioritySelect from "./PrioritySelect";
import { formatDate, formatSalary } from "../../lib/utils";
import { STATUS_DOT_COLORS, PRIORITY_DOT_COLORS } from "../../lib/constants";

type SortKey =
  | "company"
  | "title"
  | "status"
  | "priority"
  | "dateApplied"
  | "location"
  | "salary";
type SortDir = "asc" | "desc";

const HEADERS: { key: SortKey; label: string; hideOnSmall?: boolean }[] = [
  { key: "company", label: "Company" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "dateApplied", label: "Date Applied" },
  { key: "location", label: "Location", hideOnSmall: true },
  { key: "salary", label: "Salary", hideOnSmall: true },
];

function sortValue(app: Application, key: SortKey): string | number {
  switch (key) {
    case "company":
      return app.company.toLowerCase();
    case "title":
      return app.title.toLowerCase();
    case "status":
      return app.status;
    case "priority":
      return app.priority ?? "";
    case "dateApplied":
      return app.dateApplied ?? "";
    case "location":
      return (app.location ?? "").toLowerCase();
    case "salary":
      return app.salaryMin ?? 0;
  }
}

interface ApplicationTableProps {
  applications: Application[];
}

export default function ApplicationTable({ applications }: ApplicationTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("dateApplied");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...applications];
    copy.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [applications, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-secondary">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-default">
            {HEADERS.map((h) => (
              <th
                key={h.key}
                onClick={() => toggleSort(h.key)}
                className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-secondary ${
                  h.hideOnSmall ? "hidden md:table-cell" : ""
                }`}
              >
                {h.label}
                {sortKey === h.key && (
                  <span className="ml-1">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
                )}
              </th>
            ))}
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Tags
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={HEADERS.length + 1} className="px-4 py-12 text-center text-text-tertiary">
                No applications found
              </td>
            </tr>
          )}
          {sorted.map((app) => (
            <tr
              key={app.id}
              onClick={() => navigate(`/applications/${app.id}`)}
              className="cursor-pointer border-b border-border-default last:border-0 hover:bg-surface-elevated transition-colors"
            >
              <td className="px-4 py-3 font-medium text-text-primary">{app.company}</td>
              <td className="px-4 py-3 text-text-secondary">{app.title}</td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <StatusSelect applicationId={app.id} currentStatus={app.status} />
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <PrioritySelect applicationId={app.id} currentPriority={app.priority} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-text-secondary">
                {app.dateApplied ? formatDate(app.dateApplied) : "\u2014"}
              </td>
              <td className="hidden md:table-cell px-4 py-3 text-text-secondary">
                {app.location ?? "\u2014"}
              </td>
              <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-text-secondary">
                {app.salaryMin
                  ? `${formatSalary(app.salaryMin)}${app.salaryMax ? ` - ${formatSalary(app.salaryMax)}` : ""}`
                  : "\u2014"}
              </td>
              <td className="px-4 py-3">
                {(Array.isArray(app.tags) ? app.tags : []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {app.tags!.map(({ tag, tagId }) => (
                      <span
                        key={tagId}
                        className="rounded-full px-1.5 py-px text-[10px] font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
