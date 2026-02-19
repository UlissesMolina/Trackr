import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth());

// TODO: GET /stats    — total apps, response rate, rejection rate, interview conversion
// TODO: GET /chart    — applications over time data

export default router;
