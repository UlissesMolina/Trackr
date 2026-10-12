import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import {
  generateCoverLetter,
  extractFromEmails,
  analyzeMatch,
  generateFollowUpEmail,
} from "../services/ai.service";
import { getResume } from "../services/resume.service";
import { saveMatchAnalysis } from "../services/application.service";
import { InvalidMatchAnalysisError } from "../lib/matchAnalysis";
import prisma from "../lib/prisma";
import {
  validateBody,
  coverLetterSchema,
  extractEmailSchema,
  followUpEmailSchema,
  AI_LIMITS,
} from "../lib/validation";

const router = Router();

router.use(requireAuth());

router.post("/cover-letter", validateBody(coverLetterSchema), async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { jobTitle, company, applicationId } = req.body;
  let { jobDescription, resumeText } = req.body;

  // Auto-fill jobDescription from the linked application if not supplied
  if (applicationId && !jobDescription) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, clerkUserId: userId },
      select: { jobDescription: true },
    });
    if (app?.jobDescription) jobDescription = app.jobDescription.slice(0, AI_LIMITS.jobDescription);
  }

  if (!resumeText) {
    const saved = await getResume(userId);
    if (saved) resumeText = saved.content.slice(0, AI_LIMITS.resumeText);
  }

  if (!jobDescription || !resumeText) {
    res.status(400).json({ error: "jobDescription and resumeText are required. Save a resume first or provide resumeText." });
    return;
  }

  const coverLetter = await generateCoverLetter(jobDescription, resumeText, {
    jobTitle,
    company,
  });

  if (applicationId) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, clerkUserId: userId },
    });
    if (app) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { coverLetter },
      });
    }
  }

  res.json({ coverLetter });
});

router.post("/extract-from-email", validateBody(extractEmailSchema), async (req: Request, res: Response) => {
  const { emailText } = req.body;

  try {
    const applications = await extractFromEmails(emailText);
    res.json({ applications });
  } catch {
    res.status(500).json({ error: "Failed to extract applications from email text." });
  }
});

const DAY_MS = 24 * 60 * 60 * 1000;

router.post("/match/:applicationId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const applicationId = String(req.params.applicationId);

  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId: userId },
    select: { jobDescription: true },
  });
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  if (!app.jobDescription?.trim()) {
    res.status(400).json({ error: "Add a job description to this application first." });
    return;
  }

  const resume = await getResume(userId);
  if (!resume?.content.trim()) {
    res.status(400).json({ error: "Save a resume first." });
    return;
  }

  let analysis;
  try {
    analysis = await analyzeMatch(
      app.jobDescription.slice(0, AI_LIMITS.jobDescription),
      resume.content.slice(0, AI_LIMITS.resumeText)
    );
  } catch (err) {
    if (err instanceof InvalidMatchAnalysisError) {
      res.status(502).json({ error: "AI returned an invalid analysis, try again." });
      return;
    }
    throw err;
  }

  const updated = await saveMatchAnalysis(applicationId, userId, analysis, app.jobDescription);
  if (!updated) {
    res.status(409).json({ error: "The job description changed while analyzing. Try again." });
    return;
  }
  res.json(updated);
});

router.post("/follow-up-email", validateBody(followUpEmailSchema), async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { applicationId } = req.body;

  const app = await prisma.application.findFirst({
    where: { id: applicationId, clerkUserId: userId },
    select: { title: true, company: true, statusChangedAt: true, dateApplied: true, createdAt: true },
  });
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const lastActivity = Math.max(
    ...[app.statusChangedAt, app.dateApplied, app.createdAt]
      .filter((d): d is Date => d !== null)
      .map((d) => d.getTime())
  );
  const resume = await getResume(userId);

  const email = await generateFollowUpEmail({
    title: app.title,
    company: app.company,
    daysWaiting: Math.max(0, Math.floor((Date.now() - lastActivity) / DAY_MS)),
    resumeText: resume?.content.slice(0, AI_LIMITS.resumeText),
  });

  res.json({ email });
});

export default router;
