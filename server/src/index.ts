import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import applicationsRouter from "./routes/applications";
import notesRouter from "./routes/notes";
import interviewsRouter from "./routes/interviews";
import tagsRouter from "./routes/tags";
import dashboardRouter from "./routes/dashboard";
import aiRouter from "./routes/ai";
import resumeRouter from "./routes/resume";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/applications", applicationsRouter);
app.use("/api/applications", notesRouter);
app.use("/api/applications", interviewsRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRouter);
app.use("/api/resume", resumeRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
