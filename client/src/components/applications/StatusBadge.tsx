import { STATUS_LABELS, type ApplicationStatus } from "../../lib/constants";

interface StatusBadgeProps {
  status: ApplicationStatus;
}

const BADGE_CLS: Record<ApplicationStatus, string> = {
  SAVED: "bg-surface-elevated text-text-tertiary",
  APPLIED: "bg-surface-elevated text-text-tertiary",
  UNDER_REVIEW: "bg-surface-elevated text-text-tertiary",
  INTERVIEW: "bg-blue-500/12 text-blue-400",
  OFFER: "bg-green-500/12 text-green-400",
  REJECTED: "bg-red-500/12 text-red-400",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_CLS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
