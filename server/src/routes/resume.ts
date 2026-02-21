import { Router, Request, Response } from "express";
import multer from "multer";
import { requireAuth, getUserId } from "../middleware/auth";
import { getResume, upsertResume, deleteResume } from "../services/resume.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAuth());

router.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const resume = await getResume(userId);
  res.json(resume);
});

router.put("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: "Resume content is required" });
    return;
  }

  const resume = await upsertResume(userId, content.trim());
  res.json(resume);
});

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  let text: string;
  const mime = file.mimetype;

  if (mime === "application/pdf") {
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(file.buffer);
    text = parsed.text;
  } else if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  ) {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    text = result.value;
  } else if (mime === "text/plain") {
    text = file.buffer.toString("utf-8");
  } else {
    res.status(400).json({ error: "Only PDF, DOCX, DOC, and TXT files are supported" });
    return;
  }

  if (!text.trim()) {
    res.status(400).json({ error: "Could not extract any text from the file" });
    return;
  }

  const resume = await upsertResume(userId, text.trim(), file.originalname);
  res.json(resume);
});

router.delete("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  await deleteResume(userId);
  res.json({ success: true });
});

export default router;
