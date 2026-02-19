import { Link } from "react-router-dom";
import type { Application } from "../../types";
import { formatDate, formatSalary } from "../../lib/utils";

interface ApplicationCardProps {
  application: Application;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Link
      to={`/applications/${application.id}`}
      className="block rounded-lg border border-border-default bg-surface-secondary p-3.5 transition-colors hover:border-border-subtle hover:bg-surface-tertiary"
    >
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
    </Link>
  );
}
