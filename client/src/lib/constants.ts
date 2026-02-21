export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const BOARD_STATUSES = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type BoardStatus = (typeof BOARD_STATUSES)[number];

export function boardStatus(status: ApplicationStatus): BoardStatus {
  return status === "UNDER_REVIEW" ? "APPLIED" : (status as BoardStatus);
}

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  SAVED: "bg-zinc-700/50 text-zinc-300",
  APPLIED: "bg-indigo-500/20 text-indigo-400",
  UNDER_REVIEW: "bg-indigo-500/20 text-indigo-400",
  INTERVIEW: "bg-violet-500/20 text-violet-400",
  OFFER: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  SAVED: "bg-zinc-500",
  APPLIED: "bg-indigo-500",
  UNDER_REVIEW: "bg-indigo-500",
  INTERVIEW: "bg-violet-500",
  OFFER: "bg-emerald-500",
  REJECTED: "bg-red-500",
};

export const STATUS_LABELS: Record<string, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  UNDER_REVIEW: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export const STATUS_BORDER_COLORS: Record<string, string> = {
  SAVED: "border-l-zinc-500",
  APPLIED: "border-l-indigo-500",
  UNDER_REVIEW: "border-l-indigo-500",
  INTERVIEW: "border-l-violet-500",
  OFFER: "border-l-emerald-500",
  REJECTED: "border-l-red-500",
};

export const INTERVIEW_TYPES = [
  "PHONE_SCREEN",
  "TECHNICAL",
  "BEHAVIORAL",
  "ONSITE",
  "PANEL",
  "OTHER",
] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  ONSITE: "Onsite",
  PANEL: "Panel",
  OTHER: "Other",
};

export const TAG_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
];
