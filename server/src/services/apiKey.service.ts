import crypto from "crypto";
import prisma from "../lib/prisma";

function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function generateApiKey(clerkUserId: string, label: string) {
  const raw = `trk_${crypto.randomBytes(32).toString("hex")}`;
  const hashed = hashKey(raw);

  const apiKey = await prisma.apiKey.create({
    data: { key: hashed, label, clerkUserId },
  });

  return { id: apiKey.id, label: apiKey.label, createdAt: apiKey.createdAt, rawKey: raw };
}

export function listApiKeys(clerkUserId: string) {
  return prisma.apiKey.findMany({
    where: { clerkUserId },
    select: { id: true, label: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export function deleteApiKey(id: string, clerkUserId: string) {
  return prisma.apiKey.deleteMany({ where: { id, clerkUserId } });
}

export async function verifyApiKey(raw: string): Promise<string | null> {
  const hashed = hashKey(raw);
  const record = await prisma.apiKey.findUnique({ where: { key: hashed } });
  return record?.clerkUserId ?? null;
}
