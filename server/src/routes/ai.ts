import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth());

// TODO: POST /cover-letter — generate cover letter from job description + resume

export default router;
