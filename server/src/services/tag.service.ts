import prisma from "../lib/prisma";

export function listTags(clerkUserId: string) {
  return prisma.tag.findMany({
    where: { clerkUserId },
    orderBy: { name: "asc" },
  });
}

export function createTag(
  clerkUserId: string,
  data: { name: string; color?: string }
) {
  return prisma.tag.create({
    data: {
      clerkUserId,
      name: data.name.trim(),
      color: data.color || "#6366f1",
    },
  });
}

export async function deleteTag(tagId: string, clerkUserId: string) {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, clerkUserId },
  });

  if (!tag) return null;

  return prisma.tag.delete({ where: { id: tagId } });
}

export async function addTagToApplication(
  applicationId: string,
  tagId: string,
  clerkUserId: string
) {
  const [app, tag] = await Promise.all([
    prisma.application.findFirst({
      where: { id: applicationId, clerkUserId },
      select: { id: true },
    }),
    prisma.tag.findFirst({
      where: { id: tagId, clerkUserId },
      select: { id: true },
    }),
  ]);

  if (!app || !tag) return null;

  return prisma.applicationTag.upsert({
    where: { applicationId_tagId: { applicationId, tagId } },
    create: { applicationId, tagId },
    update: {},
    include: { tag: true },
  });
}

export async function removeTagFromApplication(
  applicationId: string,
  tagId: string,
  clerkUserId: string
) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId },
    select: { id: true },
  });

  if (!app) return null;

  return prisma.applicationTag.delete({
    where: { applicationId_tagId: { applicationId, tagId } },
  });
}
