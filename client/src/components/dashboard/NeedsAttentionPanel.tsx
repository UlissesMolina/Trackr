import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAttentionItems, type AttentionItem } from "../../lib/attention";
import { getStaleDays } from "../../lib/settings";
import { formatRelativeDateTime } from "../../lib/utils";
import { INTERVIEW_TYPE_LABELS } from "../../lib/constants";
import StaleActions from "../applications/StaleActions";
import type { Application } from "../../types";

const VISIBLE_LIMIT = 8;

const RED = "bg-red-500/12 text-red-400";
const AMBER = "bg-yellow-500/12 text-yellow-400";

function describe(item: AttentionItem): { label: string; tone: string } {
  switch (item.kind) {
    case "FOLLOW_UP_OVERDUE":
      return { label: `Follow-up ${item.days}d overdue`, tone: RED };
    case "OA_DUE_SOON":
      if (item.days < 0) return { label: `OA ${-item.days}d overdue`, tone: RED };
      return { label: item.days === 0 ? "OA due today" : `OA due in ${item.days}d`, tone: AMBER };
    case "INTERVIEW_SOON": {
      const type = item.interview ? INTERVIEW_TYPE_LABELS[item.interview.type] : "Interview";
      return { label: `${type} · ${formatRelativeDateTime(item.date)}`, tone: "bg-accent/15 text-accent" };
    }
    case "STALE":
      return { label: `No response in ${item.days}d`, tone: "bg-surface-tertiary text-text-tertiary" };
  }
}

interface NeedsAttentionPanelProps {
  applications: Application[];
  loading?: boolean;
}

export default function NeedsAttentionPanel({ applications, loading = false }: NeedsAttentionPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const items = useMemo(
    () => getAttentionItems(applications, new Date(), getStaleDays()),
    [applications]
  );
  const visible = showAll ? items : items.slice(0, VISIBLE_LIMIT);

  return (
    <div>
      <p className="mb-3 text-[13px] font-medium text-text-secondary">
        Needs attention
        {items.length > 0 && <span className="ml-1.5 text-text-tertiary">{items.length}</span>}
      </p>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-tertiary" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[10px] bg-surface-tertiary p-5 text-center">
          <p className="text-sm text-text-tertiary">You&apos;re all caught up</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Overdue follow-ups, OA deadlines, upcoming interviews, and stale applications show up here
          </p>
        </div>
      ) : (
        <div>
          {visible.map((item) => {
            const { label, tone } = describe(item);
            return (
              <div key={item.key} className="rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-tertiary">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to={`/applications/${item.application.id}`}
                    className="min-w-0 truncate text-sm text-text-secondary hover:text-text-primary"
                  >
                    <span className="text-text-primary">{item.application.company}</span>
                    {" — "}
                    {item.application.title}
                  </Link>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
                    {label}
                  </span>
                </div>
                {item.kind === "STALE" && (
                  <div className="mt-2">
                    <StaleActions application={item.application} size="sm" />
                  </div>
                )}
              </div>
            );
          })}
          {items.length > VISIBLE_LIMIT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 px-2 text-[13px] text-text-tertiary transition-colors hover:text-text-secondary"
            >
              {showAll ? "Show less" : `Show all ${items.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
