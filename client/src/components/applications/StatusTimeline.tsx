import type { StatusChange } from "../../types";
import { STATUS_LABELS, STATUS_DOT_COLORS, type ApplicationStatus } from "../../lib/constants";

interface StatusTimelineProps {
  statusChanges: StatusChange[];
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function StatusTimeline({ statusChanges }: StatusTimelineProps) {
  const safe = Array.isArray(statusChanges) ? statusChanges : [];
  if (safe.length === 0) {
    return <p className="text-sm text-text-tertiary">No status changes yet.</p>;
  }

  return (
    <div className="space-y-0">
      {safe.map((change, i) => (
        <div key={change.id} className="relative flex gap-3 pb-6 last:pb-0">
            {i < safe.length - 1 && (
            <div className="absolute left-[7px] top-4 h-full w-px bg-border-default" />
          )}
          <div className="relative mt-1.5 flex-shrink-0">
            <div className={`h-[15px] w-[15px] rounded-full ${STATUS_DOT_COLORS[change.toStatus as ApplicationStatus]}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-text-primary">
              <span className="font-medium">{STATUS_LABELS[change.fromStatus as ApplicationStatus]}</span>
              {" → "}
              <span className="font-medium">{STATUS_LABELS[change.toStatus as ApplicationStatus]}</span>
            </p>
            <p className="text-xs text-text-tertiary">{timeAgo(change.changedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
