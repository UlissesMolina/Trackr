import { Link } from "react-router-dom";
import type { Application } from "../../types";
import { formatShortDate } from "../../lib/utils";
import { STATUS_BORDER_COLORS } from "../../lib/constants";

interface ApplicationCardProps {
  application: Application;
}

function getFollowUpIndicator(followUpDate: string | null) {
  if (!followUpDate) return null;
  const followUp = new Date(followUpDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  followUp.setHours(0, 0, 0, 0);
  const diff = followUp.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Overdue", color: "text-red-400" };
  if (days === 0) return { label: "Today", color: "text-amber-400" };
  if (days <= 2) return { label: `${days}d`, color: "text-amber-400" };
  return null;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const followUp = getFollowUpIndicator(application.followUpDate);
  const tags = Array.isArray(application.tags) ? application.tags : [];
  const borderColor = STATUS_BORDER_COLORS[application.status] ?? "border-l-zinc-500";

  return (
    <Link
      to={`/applications/${application.id}`}
      className={`block rounded-lg border border-border-default border-l-[3px] ${borderColor} bg-surface-secondary p-2 px-3 transition-colors hover:border-border-subtle hover:border-l-[3px] hover:bg-surface-tertiary ${borderColor}`}
    >
      {tags.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {tags.map(({ tag, tagId }) => (
            <span
              key={tagId}
              className="rounded-full px-1.5 py-px text-[9px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-medium text-text-primary">
          {application.title}
        </h3>
        {followUp && (
          <span className={`flex shrink-0 items-center gap-0.5 text-[10px] font-medium ${followUp.color}`}>
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {followUp.label}
          </span>
        )}
      </div>

      <p className="mt-0.5 truncate text-xs text-text-secondary">
        {application.company}
        {application.dateApplied && (
          <span className="text-text-tertiary"> · {formatShortDate(application.dateApplied)}</span>
        )}
      </p>
    </Link>
  );
}
