import prisma from "../lib/prisma";
import { InterviewType } from "../../generated/prisma/enums";

export async function listInterviews(
  applicationId: string,
  clerkUserId: string
) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId },
    select: { id: true },
  });

  if (!app) return null;

  return prisma.interview.findMany({
    where: { applicationId },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function createInterview(
  applicationId: string,
  clerkUserId: string,
  data: {
    type: InterviewType;
    scheduledAt: string;
    location?: string;
    notes?: string;
  }
) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId },
    select: { id: true },
  });

  if (!app) return null;

  return prisma.interview.create({
    data: {
      applicationId,
      type: data.type,
      scheduledAt: new Date(data.scheduledAt),
      location: data.location || null,
      notes: data.notes || null,
    },
  });
}

export async function updateInterview(
  interviewId: string,
  clerkUserId: string,
  data: {
    type?: InterviewType;
    scheduledAt?: string;
    location?: string | null;
    notes?: string | null;
  }
) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: { application: { select: { clerkUserId: true } } },
  });

  if (!interview || interview.application.clerkUserId !== clerkUserId)
    return null;

  return prisma.interview.update({
    where: { id: interviewId },
    data: {
      ...data,
      scheduledAt: data.scheduledAt
        ? new Date(data.scheduledAt)
        : undefined,
    },
  });
}

export async function deleteInterview(
  interviewId: string,
  clerkUserId: string
) {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: { application: { select: { clerkUserId: true } } },
  });

  if (!interview || interview.application.clerkUserId !== clerkUserId)
    return null;

  return prisma.interview.delete({ where: { id: interviewId } });
}
