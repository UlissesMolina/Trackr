import prisma from "../lib/prisma";
import { ApplicationStatus, ApplicationPriority } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import type { MatchAnalysis } from "../lib/matchAnalysis";

function toPriority(v: unknown): ApplicationPriority | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && ["HIGH", "MEDIUM", "LOW"].includes(v)) return v as ApplicationPriority;
  return null;
}

const APPLICATION_INCLUDE = {
  notes: true,
  interviews: { orderBy: { scheduledAt: "asc" as const } },
  tags: { include: { tag: true } },
  onlineAssessment: true,
};

export function listApplications(clerkUserId: string) {
  return prisma.application.findMany({
    where: { clerkUserId },
    include: APPLICATION_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export function getApplication(id: string, clerkUserId: string) {
  return prisma.application.findFirst({
    where: { id, clerkUserId },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      statusChanges: { orderBy: { changedAt: "desc" } },
      interviews: { orderBy: { scheduledAt: "asc" } },
      tags: { include: { tag: true } },
      onlineAssessment: true,
    },
  });
}

export function createApplication(
  clerkUserId: string,
  data: {
    title: string;
    company: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    url?: string;
    jobDescription?: string;
    status?: ApplicationStatus;
    priority?: string | null;
    dateApplied?: string;
    followUpDate?: string;
    rejectionDate?: string;
  }
) {
  return prisma.application.create({
    data: {
      clerkUserId,
      title: data.title,
      company: data.company,
      location: data.location,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      url: data.url,
      jobDescription: data.jobDescription,
      status: data.status ?? ApplicationStatus.SAVED,
      priority: toPriority(data.priority),
      dateApplied: data.dateApplied ? new Date(data.dateApplied) : null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      rejectionDate: data.rejectionDate ? new Date(data.rejectionDate) : null,
      statusChangedAt: new Date(),
    },
    include: APPLICATION_INCLUDE,
  });
}

export async function updateApplication(
  id: string,
  clerkUserId: string,
  data: {
    title?: string;
    company?: string;
    location?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    url?: string | null;
    jobDescription?: string | null;
    priority?: ApplicationPriority | string | null;
    dateApplied?: string | null;
    followUpDate?: string | null;
    rejectionDate?: string | null;
    coverLetter?: string | null;
  }
) {
  const { priority, dateApplied, followUpDate, rejectionDate, ...rest } = data;

  // A match analysis is only valid for the job description it was run against.
  let clearMatch = false;
  if (data.jobDescription !== undefined) {
    const current = await prisma.application.findFirst({
      where: { id, clerkUserId },
      select: { jobDescription: true },
    });
    clearMatch = !!current && (current.jobDescription || null) !== (data.jobDescription || null);
  }

  return prisma.application.updateMany({
    where: { id, clerkUserId },
    data: {
      ...rest,
      ...(clearMatch && { matchAnalysis: Prisma.DbNull, matchAnalyzedAt: null }),
      priority: priority !== undefined ? toPriority(priority) : undefined,
      dateApplied: dateApplied !== undefined
        ? dateApplied ? new Date(dateApplied) : null
        : undefined,
      followUpDate: followUpDate !== undefined
        ? followUpDate ? new Date(followUpDate) : null
        : undefined,
      rejectionDate: rejectionDate !== undefined
        ? rejectionDate ? new Date(rejectionDate) : null
        : undefined,
    },
  });
}

export async function updateApplicationStatus(
  id: string,
  clerkUserId: string,
  newStatus: ApplicationStatus
) {
  // Optimistic concurrency: only apply the change if the status is still what we
  // read, so two quick moves can't both record the same "from" status.
  for (let attempt = 0; attempt < 3; attempt++) {
    const app = await prisma.application.findFirst({
      where: { id, clerkUserId },
      select: { status: true },
    });

    if (!app) return null;
    if (app.status === newStatus) {
      return prisma.application.findFirst({ where: { id, clerkUserId }, include: APPLICATION_INCLUDE });
    }

    const applied = await prisma.$transaction(async (tx) => {
      const { count } = await tx.application.updateMany({
        where: { id, clerkUserId, status: app.status },
        data: { status: newStatus, statusChangedAt: new Date() },
      });
      if (count === 0) return false;
      await tx.statusChange.create({
        data: { applicationId: id, fromStatus: app.status, toStatus: newStatus },
      });
      return true;
    });

    if (applied) {
      return prisma.application.findFirst({
        where: { id, clerkUserId },
        include: APPLICATION_INCLUDE,
      });
    }
  }

  throw new Error("Status changed concurrently, please retry");
}

/**
 * Save an analysis only if the job description is still the one that was analyzed,
 * so an edit made while the AI call was running isn't paired with a stale result.
 * Returns null if the application is gone or its job description changed.
 */
export async function saveMatchAnalysis(
  id: string,
  clerkUserId: string,
  analysis: MatchAnalysis,
  analyzedJobDescription: string
) {
  const { count } = await prisma.application.updateMany({
    where: { id, clerkUserId, jobDescription: analyzedJobDescription },
    data: { matchAnalysis: analysis, matchAnalyzedAt: new Date() },
  });
  if (count === 0) return null;
  return getApplication(id, clerkUserId);
}

export function bulkCreateApplications(
  clerkUserId: string,
  rows: Array<{
    title: string;
    company: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    url?: string;
    status?: ApplicationStatus;
    priority?: string | null;
    dateApplied?: string;
  }>
) {
  const data = rows.map((row) => ({
    clerkUserId,
    title: row.title,
    company: row.company,
    location: row.location || null,
    salaryMin: row.salaryMin || null,
    salaryMax: row.salaryMax || null,
    url: row.url || null,
    status: row.status ?? ApplicationStatus.SAVED,
    priority: toPriority(row.priority),
    dateApplied: row.dateApplied ? new Date(row.dateApplied) : null,
    statusChangedAt: new Date(),
  }));

  return prisma.application.createMany({ data });
}

export async function clearAllApplications(clerkUserId: string) {
  const result = await prisma.application.deleteMany({
    where: { clerkUserId },
  });
  return result.count;
}

export async function deleteApplication(id: string, clerkUserId: string) {
  const app = await prisma.application.findFirst({
    where: { id, clerkUserId },
  });

  if (!app) return null;

  return prisma.application.delete({ where: { id } });
}
