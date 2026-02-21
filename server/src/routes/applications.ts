import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import * as appService from "../services/application.service";

const router = Router();

router.use(requireAuth());

function paramId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

router.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const apps = await appService.listApplications(userId);
  res.json(apps);
});

router.get("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const app = await appService.getApplication(paramId(req), userId);
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(app);
});

router.post("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const app = await appService.createApplication(userId, req.body);
  res.status(201).json(app);
});

router.post("/import", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { applications } = req.body;
  if (!Array.isArray(applications) || applications.length === 0) {
    res.status(400).json({ error: "applications array is required" });
    return;
  }
  const result = await appService.bulkCreateApplications(userId, applications);
  res.status(201).json({ imported: result.count });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const id = paramId(req);
  const result = await appService.updateApplication(id, userId, req.body);
  if (result.count === 0) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const updated = await appService.getApplication(id, userId);
  res.json(updated);
});

router.patch("/:id/status", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { status } = req.body;
  const updated = await appService.updateApplicationStatus(paramId(req), userId, status);
  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(updated);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const deleted = await appService.deleteApplication(paramId(req), userId);
  if (!deleted) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.status(204).send();
});

export default router;
