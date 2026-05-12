import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import * as apiKeyService from "../services/apiKey.service";

const router = Router();

router.use(requireAuth());

router.post("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { label } = req.body;
  if (!label || typeof label !== "string") {
    res.status(400).json({ error: "label is required" });
    return;
  }
  const result = await apiKeyService.generateApiKey(userId, label.trim());
  res.status(201).json(result);
});

router.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const keys = await apiKeyService.listApiKeys(userId);
  res.json(keys);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { count } = await apiKeyService.deleteApiKey(id, userId);
  if (count === 0) {
    res.status(404).json({ error: "API key not found" });
    return;
  }
  res.status(204).send();
});

export default router;
