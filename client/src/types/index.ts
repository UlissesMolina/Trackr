import type { ApplicationStatus } from "../lib/constants";

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
  coverLetter: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: Note[];
  statusChanges?: StatusChange[];
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

export interface DashboardStats {
  totalApplications: number;
  responseRate: number;
  rejectionRate: number;
  interviewConversion: number;
}

export interface Resume {
  id: string;
  clerkUserId: string;
  content: string;
  fileName: string | null;
  updatedAt: string;
  createdAt: string;
}
