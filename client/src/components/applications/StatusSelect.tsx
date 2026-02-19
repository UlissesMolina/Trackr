import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "../../lib/constants";
import { useUpdateApplicationStatus } from "../../hooks/useApplications";

interface StatusSelectProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
}

export default function StatusSelect({ applicationId, currentStatus }: StatusSelectProps) {
  const mutation = useUpdateApplicationStatus();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as ApplicationStatus;
    if (status !== currentStatus) {
      mutation.mutate({ id: applicationId, status });
    }
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={mutation.isPending}
      className="rounded-lg border border-border-default bg-surface-tertiary px-3 py-1.5 text-sm font-medium text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
    >
      {APPLICATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
