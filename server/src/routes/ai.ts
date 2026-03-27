import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { generateCoverLetter, extractFromEmails } from "../services/ai.service";
import { getResume } from "../services/resume.service";
import prisma from "../lib/prisma";

const router = Router();

router.use(requireAuth());

router.post("/cover-letter", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { jobTitle, company, applicationId } = req.body;
  let { jobDescription, resumeText } = req.body;

  // Auto-fill jobDescription from the linked application if not supplied
  if (applicationId && !jobDescription) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, clerkUserId: userId },
      select: { jobDescription: true },
    });
    if (app?.jobDescription) jobDescription = app.jobDescription;
  }

  if (!resumeText) {
    const saved = await getResume(userId);
    if (saved) resumeText = saved.content;
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

router.post("/extract-from-email", async (req: Request, res: Response) => {
  const { emailText } = req.body;

  if (!emailText || typeof emailText !== "string" || emailText.trim().length < 10) {
    res.status(400).json({ error: "Please paste your email text (at least 10 characters)." });
    return;
  }

  try {
    const applications = await extractFromEmails(emailText);
    res.json({ applications });
  } catch {
    res.status(500).json({ error: "Failed to extract applications from email text." });
  }
});

export default router;
