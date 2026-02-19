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
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="truncate text-sm font-semibold text-gray-900">
        {application.title}
      </h3>
      <p className="mt-1 truncate text-sm text-gray-600">{application.company}</p>

      {application.location && (
        <p className="mt-1 truncate text-xs text-gray-500">{application.location}</p>
      )}

      {(application.salaryMin || application.salaryMax) && (
        <p className="mt-2 text-xs text-gray-500">
          {application.salaryMin && application.salaryMax
            ? `${formatSalary(application.salaryMin)} – ${formatSalary(application.salaryMax)}`
            : application.salaryMin
              ? `From ${formatSalary(application.salaryMin)}`
              : `Up to ${formatSalary(application.salaryMax!)}`}
        </p>
      )}

      {application.dateApplied && (
        <p className="mt-2 text-xs text-gray-400">
          Applied {formatDate(application.dateApplied)}
        </p>
      )}
    </Link>
  );
}
