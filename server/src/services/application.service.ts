import prisma from "../lib/prisma";
import { ApplicationStatus, ApplicationPriority } from "../../generated/prisma/enums";

function toPriority(v: unknown): ApplicationPriority | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && ["HIGH", "MEDIUM", "LOW"].includes(v)) return v as ApplicationPriority;
  return null;
}

const APPLICATION_INCLUDE = {
  notes: true,
  statusChanges: true,
  interviews: { orderBy: { scheduledAt: "asc" as const } },
  tags: { include: { tag: true } },
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
    status?: ApplicationStatus;
    priority?: string | null;
    dateApplied?: string;
    followUpDate?: string;
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
      status: data.status ?? ApplicationStatus.SAVED,
      priority: toPriority(data.priority),
      dateApplied: data.dateApplied ? new Date(data.dateApplied) : null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
    },
  });
}

export function updateApplication(
  id: string,
  clerkUserId: string,
  data: {
    title?: string;
    company?: string;
    location?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    url?: string | null;
    priority?: ApplicationPriority | string | null;
    dateApplied?: string | null;
    followUpDate?: string | null;
    coverLetter?: string | null;
  }
) {
  const { priority, dateApplied, followUpDate, ...rest } = data;
  return prisma.application.updateMany({
    where: { id, clerkUserId },
    data: {
      ...rest,
      priority: priority !== undefined ? toPriority(priority) : undefined,
      dateApplied: dateApplied !== undefined
        ? dateApplied ? new Date(dateApplied) : null
        : undefined,
      followUpDate: followUpDate !== undefined
        ? followUpDate ? new Date(followUpDate) : null
        : undefined,
    },
  });
}

export async function updateApplicationStatus(
  id: string,
  clerkUserId: string,
  newStatus: ApplicationStatus
) {
  const app = await prisma.application.findFirst({
    where: { id, clerkUserId },
  });

  if (!app) return null;

  const [updated] = await prisma.$transaction([
    prisma.application.update({
      where: { id },
      data: { status: newStatus },
    }),
    prisma.statusChange.create({
      data: {
        applicationId: id,
        fromStatus: app.status,
        toStatus: newStatus,
      },
    }),
  ]);

  return updated;
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
  }));

  return prisma.application.createMany({ data });
}

export async function deleteApplication(id: string, clerkUserId: string) {
  const app = await prisma.application.findFirst({
    where: { id, clerkUserId },
  });

  if (!app) return null;

  return prisma.application.delete({ where: { id } });
}
