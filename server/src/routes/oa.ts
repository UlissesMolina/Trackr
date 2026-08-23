import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import * as oaService from "../services/oa.service";

const router = Router();

router.use(requireAuth());

function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

router.get("/:applicationId/oa", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const oa = await oaService.getOA(param(req, "applicationId"), userId);
  if (oa === null) {
    res.json(null);
    return;
  }
  res.json(oa);
});

router.put("/:applicationId/oa", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const oa = await oaService.upsertOA(param(req, "applicationId"), userId, req.body);
  if (!oa) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(oa);
});

router.delete("/:applicationId/oa", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const deleted = await oaService.deleteOA(param(req, "applicationId"), userId);
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

export default router;
