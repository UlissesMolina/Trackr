import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter, aiLimiter } from "./middleware/rateLimit";
import applicationsRouter from "./routes/applications";
import notesRouter from "./routes/notes";
import interviewsRouter from "./routes/interviews";
import tagsRouter from "./routes/tags";
import dashboardRouter from "./routes/dashboard";
import aiRouter from "./routes/ai";
import resumeRouter from "./routes/resume";
import jobsRouter from "./routes/jobs";
import apiKeysRouter from "./routes/apiKeys";
import { apiKeyAuth, getUserId } from "./middleware/auth";
import * as appService from "./services/application.service";

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
app.get("/", (_req, res) => res.json({ status: "ok", message: "Trackr API" }));
app.get("/favicon.ico", (_req, res) => res.status(204).end());

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
app.use("/api/tags", tagsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiLimiter, aiRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/api-keys", apiKeysRouter);

// Extension endpoint — uses API key auth instead of Clerk
app.post("/api/ext/applications", apiKeyAuth, async (req, res) => {
  const userId = getUserId(req);
  const app = await appService.createApplication(userId, req.body);
  res.status(201).json(app);
});

app.use(errorHandler);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});
