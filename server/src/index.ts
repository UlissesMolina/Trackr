import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter, aiLimiter } from "./middleware/rateLimit";
import applicationsRouter from "./routes/applications";
import notesRouter from "./routes/notes";
import interviewsRouter from "./routes/interviews";
import oaRouter from "./routes/oa";
import tagsRouter from "./routes/tags";
import dashboardRouter from "./routes/dashboard";
import aiRouter from "./routes/ai";
import resumeRouter from "./routes/resume";
import jobsRouter from "./routes/jobs";
import extAuthRouter from "./routes/extAuth";
import gmailRouter, { gmailCallback } from "./routes/gmail";
import { runScheduledSyncs } from "./services/email-sync.service";
import { isGmailConfigured } from "./services/gmail.service";
import { extTokenAuth, getUserId } from "./middleware/auth";
import * as appService from "./services/application.service";
import { validateBody, createApplicationSchema, updateStatusSchema } from "./lib/validation";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.set("trust proxy", 1);

console.log("ENV check:", {
  hasDbUrl: !!process.env.DATABASE_URL,
  hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
  hasClerkPublishable: !!process.env.CLERK_PUBLISHABLE_KEY,
  clientUrl: process.env.CLIENT_URL,
  port: PORT,
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/health/db", async (_req, res) => {
  try {
    const { pool } = await import("./lib/prisma");
    const start = Date.now();
    await pool.query("SELECT 1");
    res.json({ status: "ok", latency: `${Date.now() - start}ms` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(503).json({ status: "error", error: message });
  }
});
app.get("/", (_req, res) => res.json({ status: "ok", message: "Trackr API" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());

// Extension sign-in pages are same-origin and never called cross-origin, so they sit before CORS.
app.use("/api/ext/auth", extAuthRouter);
// Google redirects the browser here after consent; no Clerk session on that request.
app.get("/api/gmail/callback", gmailCallback);

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL || "http://localhost:5173",
      "https://usetrackr.netlify.app",
    ];
    // Allow requests with no origin (e.g. mobile apps, curl) or chrome extensions
    if (!origin || allowed.includes(origin) || origin.startsWith("chrome-extension://")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(generalLimiter);

// Extension routes use their own JWT, so they skip Clerk's middleware.

app.post("/api/ext/applications", extTokenAuth, validateBody(createApplicationSchema), async (req, res) => {
  const userId = getUserId(req);
  const app = await appService.createApplication(userId, req.body);
  res.status(201).json(app);
});

// Is this posting already tracked? The popup warns instead of creating a duplicate.
app.get("/api/ext/applications/lookup", extTokenAuth, async (req, res) => {
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 2000) : undefined);
  const match = await appService.findExistingApplication(getUserId(req), {
    url: str(req.query.url),
    company: str(req.query.company),
    title: str(req.query.title),
  });
  res.json(match);
});

app.patch("/api/ext/applications/:id/status", extTokenAuth, validateBody(updateStatusSchema), async (req, res) => {
  const updated = await appService.updateApplicationStatus(String(req.params.id), getUserId(req), req.body.status);
  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(updated);
});

app.use(clerkMiddleware({
  authorizedParties: [
    "https://usetrackr.netlify.app",
    process.env.CLIENT_URL,
    "http://localhost:5173",
  ].filter(Boolean) as string[],
}));

app.use("/api/applications", applicationsRouter);
app.use("/api/applications", notesRouter);
app.use("/api/applications", interviewsRouter);
app.use("/api/applications", oaRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiLimiter, aiRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/gmail", gmailRouter);

app.use(errorHandler);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});

// Gmail auto-sync: every 6 hours, starting a couple of minutes after boot.
if (isGmailConfigured()) {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setTimeout(() => {
    runScheduledSyncs();
    setInterval(runScheduledSyncs, SIX_HOURS);
  }, 2 * 60 * 1000);
}
