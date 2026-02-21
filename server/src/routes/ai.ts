import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { generateCoverLetter } from "../services/ai.service";
import { getResume } from "../services/resume.service";
import prisma from "../lib/prisma";

const router = Router();

router.use(requireAuth());

router.post("/cover-letter", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { jobDescription, jobTitle, company, applicationId } = req.body;
  let { resumeText } = req.body;

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

export default router;
