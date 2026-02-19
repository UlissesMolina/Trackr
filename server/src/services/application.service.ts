import prisma from "../lib/prisma";
import { ApplicationStatus } from "../../generated/prisma/enums";

export function listApplications(clerkUserId: string) {
  return prisma.application.findMany({
    where: { clerkUserId },
    include: { notes: true, statusChanges: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getApplication(id: string, clerkUserId: string) {
  return prisma.application.findFirst({
    where: { id, clerkUserId },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      statusChanges: { orderBy: { changedAt: "desc" } },
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
    dateApplied?: string;
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
      dateApplied: data.dateApplied ? new Date(data.dateApplied) : null,
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
    dateApplied?: string | null;
    coverLetter?: string | null;
  }
) {
  return prisma.application.updateMany({
    where: { id, clerkUserId },
    data: {
      ...data,
      dateApplied: data.dateApplied !== undefined
        ? data.dateApplied ? new Date(data.dateApplied) : null
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

export async function deleteApplication(id: string, clerkUserId: string) {
  const app = await prisma.application.findFirst({
    where: { id, clerkUserId },
  });

  if (!app) return null;

  return prisma.application.delete({ where: { id } });
}
