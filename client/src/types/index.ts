import type { ApplicationStatus, InterviewType } from "../lib/constants";

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
  dateApplied: string | null;
  followUpDate: string | null;
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: Note[];
  statusChanges?: StatusChange[];
  interviews?: Interview[];
  tags?: ApplicationTag[];
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

export interface DashboardStats {
  totalApplications: number;
  applicationsThisWeek?: number;
  responseRate: number;
  rejectionRate: number;
  interviewConversion: number;
  interviewsCount?: number;
  offersCount?: number;
}

export interface Resume {
  id: string;
  clerkUserId: string;
  content: string;
  fileName: string | null;
  updatedAt: string;
  createdAt: string;
}
