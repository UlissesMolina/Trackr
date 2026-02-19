export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "bg-zinc-700/50 text-zinc-300",
  APPLIED: "bg-indigo-500/20 text-indigo-400",
  UNDER_REVIEW: "bg-amber-500/20 text-amber-400",
  INTERVIEW: "bg-violet-500/20 text-violet-400",
  OFFER: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export const STATUS_DOT_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "bg-zinc-500",
  APPLIED: "bg-indigo-500",
  UNDER_REVIEW: "bg-amber-500",
  INTERVIEW: "bg-violet-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-red-500",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  UNDER_REVIEW: "Under Review",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};
