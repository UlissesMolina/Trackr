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
  SAVED: "bg-gray-100 text-gray-600",
  APPLIED: "bg-gray-100 text-gray-600",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  INTERVIEW: "bg-blue-50 text-blue-700",
  OFFER: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  SAVED: "bg-white/30",
  APPLIED: "bg-blue-400/60",
  UNDER_REVIEW: "bg-blue-400/60",
  INTERVIEW: "bg-amber-400/60",
  OFFER: "bg-green-400/60",
  REJECTED: "bg-red-400/60",
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
  APPLIED: "border-l-emerald-500",
  UNDER_REVIEW: "border-l-emerald-500",
  INTERVIEW: "border-l-amber-500",
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

export const PRIORITY_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;
export type ApplicationPriority = (typeof PRIORITY_LEVELS)[number];

export const PRIORITY_LABELS: Record<ApplicationPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const PRIORITY_DOT_COLORS: Record<ApplicationPriority, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-emerald-500",
};

export const TAG_COLORS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
];
