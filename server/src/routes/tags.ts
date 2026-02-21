import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import * as tagService from "../services/tag.service";

const router = Router();

router.use(requireAuth());

function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

router.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const tags = await tagService.listTags(userId);
  res.json(tags);
});

router.post("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const tag = await tagService.createTag(userId, req.body);
  res.status(201).json(tag);
});

router.delete("/:tagId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const deleted = await tagService.deleteTag(param(req, "tagId"), userId);
  if (!deleted) {
    res.status(404).json({ error: "Tag not found" });
    return;
  }
  res.status(204).send();
});

router.post("/applications/:applicationId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { tagId } = req.body;
  const result = await tagService.addTagToApplication(param(req, "applicationId"), tagId, userId);
  if (!result) {
    res.status(404).json({ error: "Application or tag not found" });
    return;
  }
  res.status(201).json(result);
});

router.delete("/applications/:applicationId/:tagId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const result = await tagService.removeTagFromApplication(
    param(req, "applicationId"),
    param(req, "tagId"),
    userId
  );
  if (!result) {
    res.status(404).json({ error: "Application or tag not found" });
    return;
  }
  res.status(204).send();
});

export default router;
