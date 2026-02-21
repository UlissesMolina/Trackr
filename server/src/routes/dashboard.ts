import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import * as dashboardService from "../services/dashboard.service";

const router = Router();

router.use(requireAuth());

router.get("/stats", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const stats = await dashboardService.getStats(userId);
  res.json(stats);
});

router.get("/chart", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const data = await dashboardService.getChartData(userId);
  res.json(data);
});

router.get("/sankey", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const data = await dashboardService.getSankeyData(userId);
  res.json(data);
});

export default router;
