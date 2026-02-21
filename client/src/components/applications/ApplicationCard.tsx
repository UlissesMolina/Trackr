import { Link } from "react-router-dom";
import type { Application } from "../../types";
import { formatDate, formatSalary } from "../../lib/utils";

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
  if (days === 0) return { label: "Follow up today", color: "text-amber-400" };
  if (days <= 2) return { label: `Follow up in ${days}d`, color: "text-amber-400" };
  return null;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const followUp = getFollowUpIndicator(application.followUpDate);
  const tags = application.tags ?? [];

  return (
    <Link
      to={`/applications/${application.id}`}
      className="block rounded-lg border border-border-default bg-surface-secondary p-3.5 transition-colors hover:border-border-subtle hover:bg-surface-tertiary"
    >
      {tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {tags.map(({ tag, tagId }) => (
            <span
              key={tagId}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <h3 className="truncate text-sm font-medium text-text-primary">
        {application.title}
      </h3>
      <p className="mt-0.5 truncate text-sm text-text-secondary">{application.company}</p>

      {application.location && (
        <p className="mt-1 truncate text-xs text-text-tertiary">{application.location}</p>
      )}

      {(application.salaryMin || application.salaryMax) && (
        <p className="mt-2 text-xs text-text-tertiary">
          {application.salaryMin && application.salaryMax
            ? `${formatSalary(application.salaryMin)} – ${formatSalary(application.salaryMax)}`
            : application.salaryMin
              ? `From ${formatSalary(application.salaryMin)}`
              : `Up to ${formatSalary(application.salaryMax!)}`}
        </p>
      )}

      {application.dateApplied && (
        <p className="mt-2 text-xs text-text-tertiary">
          Applied {formatDate(application.dateApplied)}
        </p>
      )}

      {followUp && (
        <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${followUp.color}`}>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {followUp.label}
        </p>
      )}
    </Link>
  );
}
