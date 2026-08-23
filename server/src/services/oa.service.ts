import prisma from "../lib/prisma";
import { OAStatus } from "../../generated/prisma/enums";

export async function getOA(applicationId: string, clerkUserId: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId },
    select: { id: true },
  });

  if (!app) return null;

  return prisma.onlineAssessment.findUnique({
    where: { applicationId },
  });
}

export async function upsertOA(
  applicationId: string,
  clerkUserId: string,
  data: {
    platform?: string | null;
    dueDate?: string | null;
    status?: OAStatus;
    completedAt?: string | null;
    link?: string | null;
    notes?: string | null;
  }
) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId },
    select: { id: true },
  });

  if (!app) return null;

  const upsertData = {
    platform: data.platform ?? null,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    status: data.status ?? OAStatus.PENDING,
    completedAt: data.completedAt ? new Date(data.completedAt) : null,
    link: data.link ?? null,
    notes: data.notes ?? null,
  };

  return prisma.onlineAssessment.upsert({
    where: { applicationId },
    create: { applicationId, ...upsertData },
    update: upsertData,
  });
}

export async function deleteOA(applicationId: string, clerkUserId: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId },
    select: { id: true },
  });

  if (!app) return null;

  const existing = await prisma.onlineAssessment.findUnique({
    where: { applicationId },
  });

  if (!existing) return null;

  return prisma.onlineAssessment.delete({
    where: { applicationId },
  });
}
