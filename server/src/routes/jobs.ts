import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import * as jobService from "../services/job.service";

const router = Router();

router.use(requireAuth());

router.get("/export/csv", async (req: Request, res: Response) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 1, 1), 365);
    const jobs = await jobService.getJobsForExport(days);
    const csv = jobService.jobsToCsv(jobs);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="jobs-last-${days}-days.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ error: "Failed to export jobs" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const roleType = req.query.roleType as string | undefined;
    const search = req.query.search as string | undefined;
    const usOnly = req.query.usOnly === "true";
    const postedWithin = ["7d", "14d", "30d", "all"].includes(req.query.postedWithin as string)
      ? (req.query.postedWithin as "7d" | "14d" | "30d" | "all")
      : undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await jobService.searchJobs({
      category,
      roleType,
      search,
      usOnly,
      postedWithin,
      limit,
      offset,
    });
    res.json(result);
  } catch (err) {
    console.error("Jobs fetch error:", err);
    res.status(500).json({ error: "Failed to fetch job listings" });
  }
});

export default router;
