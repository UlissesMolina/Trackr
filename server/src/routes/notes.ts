import { Router, Request, Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import * as noteService from "../services/note.service";

const router = Router();

router.use(requireAuth());

function param(req: Request, name: string): string {
  const val = req.params[name];
  return Array.isArray(val) ? val[0] : val;
}

router.get("/:applicationId/notes", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notes = await noteService.listNotes(param(req, "applicationId"), userId);
  if (!notes) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(notes);
});

router.post("/:applicationId/notes", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { content } = req.body;
  const note = await noteService.createNote(param(req, "applicationId"), userId, content);
  if (!note) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.status(201).json(note);
});

router.delete("/:applicationId/notes/:noteId", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const deleted = await noteService.deleteNote(param(req, "noteId"), userId);
  if (!deleted) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.status(204).send();
});

export default router;
