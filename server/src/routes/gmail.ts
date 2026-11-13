import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { requireAuth, getUserId } from "../middleware/auth";
import { encrypt, decrypt, isEncryptionConfigured } from "../lib/crypto";
import { validateBody, gmailSettingsSchema } from "../lib/validation";
import {
  buildAuthUrl,
  exchangeCode,
  getProfile,
  isGmailConfigured,
  revokeToken,
} from "../services/gmail.service";
import { syncGmail, SyncInProgressError } from "../services/email-sync.service";

const STATE_PURPOSE = "gmail-connect";

function configured() {
  return isGmailConfigured() && isEncryptionConfigured() && !!process.env.EXT_JWT_SECRET;
}

/* ── OAuth callback (mounted before Clerk: Google redirects the browser here) ── */

export async function gmailCallback(req: Request, res: Response) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const back = (query: string) => res.redirect(`${clientUrl}/settings?${query}`);
  const fail = (reason: string) => back(`gmail=error&reason=${encodeURIComponent(reason)}`);

  const { code, state, error } = req.query as Record<string, string | undefined>;
  if (error) return fail(error === "access_denied" ? "You cancelled the Google sign-in." : error);
  if (!code || !state) return fail("Missing code or state.");

  let clerkUserId: string;
  try {
    const payload = jwt.verify(state, process.env.EXT_JWT_SECRET!) as { sub: string; purpose: string };
    if (payload.purpose !== STATE_PURPOSE) throw new Error("wrong purpose");
    clerkUserId = payload.sub;
  } catch {
    return fail("The connect link expired. Try again from Settings.");
  }

  try {
    const { accessToken, refreshToken } = await exchangeCode(code);
    if (!refreshToken) {
      return fail("Google didn't return a refresh token. Remove Trackr at myaccount.google.com/permissions and connect again.");
    }
    const { emailAddress } = await getProfile(accessToken);
    await prisma.gmailConnection.upsert({
      where: { clerkUserId },
      create: { clerkUserId, email: emailAddress, refreshToken: encrypt(refreshToken), syncEnabled: true },
      update: { email: emailAddress, refreshToken: encrypt(refreshToken), syncEnabled: true, lastError: null },
    });
    // First sync runs in the background; the user sees progress on Settings.
    syncGmail(clerkUserId).catch((err) => console.error("Initial Gmail sync failed:", err.message));
    return back("gmail=connected");
  } catch (err) {
    console.error("Gmail callback error:", err);
    return fail("Couldn't finish connecting Gmail. Please try again.");
  }
}

/* ── Authenticated API ─────────────────────────────────────────────────── */

const router = Router();
router.use(requireAuth());

router.get("/status", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const conn = await prisma.gmailConnection.findUnique({
    where: { clerkUserId: userId },
    select: { email: true, lastSyncedAt: true, syncEnabled: true, lastError: true },
  });
  res.json({ configured: configured(), connected: !!conn, ...(conn ?? {}) });
});

router.get("/connect", (req: Request, res: Response) => {
  if (!configured()) {
    res.status(503).json({ error: "Gmail sync is not configured on this server." });
    return;
  }
  const state = jwt.sign({ sub: getUserId(req), purpose: STATE_PURPOSE }, process.env.EXT_JWT_SECRET!, {
    expiresIn: "10m",
  });
  res.json({ url: buildAuthUrl(state) });
});

router.post("/sync", async (req: Request, res: Response) => {
  try {
    res.json(await syncGmail(getUserId(req)));
  } catch (err) {
    if (err instanceof SyncInProgressError) {
      res.status(409).json({ error: err.message });
      return;
    }
    res.status(400).json({ error: (err as Error).message });
  }
});

router.patch("/", validateBody(gmailSettingsSchema), async (req: Request, res: Response) => {
  const { count } = await prisma.gmailConnection.updateMany({
    where: { clerkUserId: getUserId(req) },
    data: { syncEnabled: req.body.syncEnabled },
  });
  if (count === 0) {
    res.status(404).json({ error: "Gmail is not connected" });
    return;
  }
  res.json({ syncEnabled: req.body.syncEnabled });
});

router.delete("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const conn = await prisma.gmailConnection.findUnique({ where: { clerkUserId: userId } });
  if (conn) {
    try {
      await revokeToken(decrypt(conn.refreshToken));
    } catch {
      // Already revoked or undecryptable; drop our copy regardless.
    }
    await prisma.gmailConnection.delete({ where: { clerkUserId: userId } });
  }
  // The per-email log is Gmail-derived data too; disconnecting removes it.
  await prisma.emailSyncEvent.deleteMany({ where: { clerkUserId: userId } });
  res.json({ ok: true });
});

router.get("/events", async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const events = await prisma.emailSyncEvent.findMany({
    where: { clerkUserId: getUserId(req), classification: { not: "NOT_JOB" } },
    orderBy: { receivedAt: "desc" },
    take: limit,
  });
  res.json(events);
});

export default router;
