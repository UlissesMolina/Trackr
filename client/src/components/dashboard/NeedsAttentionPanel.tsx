import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAttentionItems, type AttentionItem } from "../../lib/attention";
import { formatRelativeDateTime } from "../../lib/utils";
import { INTERVIEW_TYPE_LABELS } from "../../lib/constants";
import type { Application } from "../../types";

const VISIBLE_LIMIT = 8;

const RED = "bg-red-500/12 text-red-400";
const AMBER = "bg-yellow-500/12 text-yellow-400";

const NEUTRAL = "bg-surface-tertiary text-text-secondary";

/** "Follow up 2d overdue" / "Follow up today" / "Follow up in 3d", toned by urgency. */
function dueLabel(prefix: string, days: number): { label: string; tone: string } {
  if (days < 0) return { label: `${prefix} ${-days}d overdue`, tone: RED };
  if (days === 0) return { label: `${prefix} today`, tone: AMBER };
  return { label: `${prefix} in ${days}d`, tone: days <= 2 ? AMBER : NEUTRAL };
}

function describe(item: AttentionItem): { label: string; tone: string } {
  switch (item.kind) {
    case "FOLLOW_UP":
      return dueLabel("Follow up", item.days ?? 0);
    case "OA": {
      const platform = item.application.onlineAssessment?.platform;
      const name = platform ? `${platform} OA` : "OA";
      return item.days === null ? { label: `${name} pending`, tone: NEUTRAL } : dueLabel(`${name} due`, item.days);
    }
    case "INTERVIEW": {
      const type = item.interview ? INTERVIEW_TYPE_LABELS[item.interview.type] : "Interview";
      const when = item.date ? formatRelativeDateTime(item.date) : "";
      return { label: `${type} · ${when}`, tone: "bg-accent/15 text-accent" };
    }
  }
}

interface NeedsAttentionPanelProps {
  applications: Application[];
  loading?: boolean;
}

export default function NeedsAttentionPanel({ applications, loading = false }: NeedsAttentionPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const items = useMemo(
    () => getAttentionItems(applications, new Date()),
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
            Follow-ups and interviews in the next week, and pending OAs, show up here
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
