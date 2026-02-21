import prisma from "../lib/prisma";

export async function listNotes(applicationId: string, clerkUserId: string) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId },
    select: { id: true },
  });

  if (!app) return null;

  return prisma.note.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNote(
  applicationId: string,
  clerkUserId: string,
  content: string
) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId },
    select: { id: true },
  });

  if (!app) return null;

  return prisma.note.create({
    data: { applicationId, content },
  });
}

export async function deleteNote(noteId: string, clerkUserId: string) {
  const note = await prisma.note.findFirst({
    where: { id: noteId },
    include: { application: { select: { clerkUserId: true } } },
  });

  if (!note || note.application.clerkUserId !== clerkUserId) return null;

  return prisma.note.delete({ where: { id: noteId } });
}
