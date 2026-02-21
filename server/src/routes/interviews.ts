import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import * as interviewService from "../services/interview.service";

const router = Router();

router.use(requireAuth());

function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

router.get("/:applicationId/interviews", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const interviews = await interviewService.listInterviews(param(req, "applicationId"), userId);
  if (!interviews) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(interviews);
});

router.post("/:applicationId/interviews", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const interview = await interviewService.createInterview(param(req, "applicationId"), userId, req.body);
  if (!interview) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.status(201).json(interview);
});

router.patch("/:applicationId/interviews/:interviewId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const updated = await interviewService.updateInterview(param(req, "interviewId"), userId, req.body);
  if (!updated) {
    res.status(404).json({ error: "Interview not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:applicationId/interviews/:interviewId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const deleted = await interviewService.deleteInterview(param(req, "interviewId"), userId);
  if (!deleted) {
    res.status(404).json({ error: "Interview not found" });
    return;
  }
  res.status(204).send();
});

export default router;
