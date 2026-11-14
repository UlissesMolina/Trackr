import type { ApplicationStatus, ApplicationPriority, InterviewType } from "../lib/constants";

export interface Application {
  id: string;
  clerkUserId: string;
  title: string;
  company: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  url: string | null;
  status: ApplicationStatus;
  priority: ApplicationPriority | null;
  dateApplied: string | null;
  followUpDate: string | null;
  rejectionDate: string | null;
  jobDescription: string | null;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: Note[];
  statusChanges?: StatusChange[];
  interviews?: Interview[];
  tags?: ApplicationTag[];
  onlineAssessment?: OnlineAssessment | null;
}

export interface Note {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
}

export interface StatusChange {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedAt: string;
}

export interface Interview {
  id: string;
  applicationId: string;
  type: InterviewType;
  scheduledAt: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  clerkUserId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface ApplicationTag {
  applicationId: string;
  tagId: string;
  tag: Tag;
}

export type OAStatus = "PENDING" | "COMPLETED";

export interface OnlineAssessment {
  id: string;
  applicationId: string;
  platform: string | null;
  dueDate: string | null;
  status: OAStatus;
  completedAt: string | null;
  link: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  /** Every application, including saved jobs. */
  totalApplications: number;
  savedCount: number;
  /** Denominator for every rate below. */
  appliedCount: number;
  applicationsThisWeek: number;
  interviewedCount: number;
  interviewRate: number;
  rejectedCount: number;
  rejectionRate: number;
  offersCount: number;
  offerRate: number;
  /** Currently in the INTERVIEW stage. */
  interviewsCount: number;
  waitingCount: number;
}

export interface Resume {
  id: string;
  clerkUserId: string;
  content: string;
  fileName: string | null;
  updatedAt: string;
  createdAt: string;
}

// ── Gmail sync ──────────────────────────────────────────────

export interface GmailStatus {
  configured: boolean;
  connected: boolean;
  /** A sync is running on the server right now. */
  syncing?: boolean;
  email?: string | null;
  lastSyncedAt?: string | null;
  syncEnabled?: boolean;
  lastError?: string | null;
}

export interface GmailSyncSummary {
  /** Set when OpenAI failed and the sync fell back to the built-in rules. */
  note?: string;
  scanned: number;
  created: number;
  updated: number;
  oaAdded: number;
  unmatched: number;
  ignored: number;
}

export interface EmailSyncEvent {
  id: string;
  applicationId: string | null;
  action: "CREATED" | "STATUS_UPDATED" | "OA_ADDED" | "UNMATCHED" | "IGNORED";
  classification: string;
  company: string | null;
  title: string | null;
  subject: string;
  sender: string;
  receivedAt: string;
  detail: string | null;
}
