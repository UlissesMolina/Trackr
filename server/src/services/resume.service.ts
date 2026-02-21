import prisma from "../lib/prisma";

export async function getResume(clerkUserId: string) {
  return prisma.resume.findUnique({ where: { clerkUserId } });
}

export async function upsertResume(
  clerkUserId: string,
  content: string,
  fileName?: string
) {
  return prisma.resume.upsert({
    where: { clerkUserId },
    update: { content, fileName },
    create: { clerkUserId, content, fileName },
  });
}

export async function deleteResume(clerkUserId: string) {
  return prisma.resume.deleteMany({ where: { clerkUserId } });
}
