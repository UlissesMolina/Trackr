import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth());

// TODO: GET    /:applicationId/notes     — list notes for application
// TODO: POST   /:applicationId/notes     — create note
// TODO: DELETE /:applicationId/notes/:id — delete note

export default router;
