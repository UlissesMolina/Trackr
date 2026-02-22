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

const PDF_MIMES = ["application/pdf", "application/x-pdf"];
const DOCX_MIMES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

function isPdf(mime: string, name: string): boolean {
  return PDF_MIMES.includes(mime) || name.toLowerCase().endsWith(".pdf");
}

function isDocx(mime: string, name: string): boolean {
  return DOCX_MIMES.includes(mime) || /\.(docx?|doc)$/i.test(name);
}

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    let text: string;
    const mime = file.mimetype;
    const name = file.originalname || "";

    if (isPdf(mime, name)) {
      try {
        const { PDFParse } = require("pdf-parse");
        const parser = new PDFParse({ data: file.buffer });
        const result = await parser.getText();
        await parser.destroy();
        text = result?.text ?? "";
      } catch (err) {
        console.error("PDF parse error:", err);
        res.status(400).json({
          error: "Could not read this PDF. Try saving as a different format (e.g. DOCX or TXT) or use a different PDF.",
        });
        return;
      }
    } else if (isDocx(mime, name)) {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else if (mime === "text/plain" || name.toLowerCase().endsWith(".txt")) {
      text = file.buffer.toString("utf-8");
    } else {
      res.status(400).json({ error: "Only PDF, DOCX, DOC, and TXT files are supported" });
      return;
    }

    if (!text?.trim()) {
      res.status(400).json({
        error: "Could not extract any text from the file. The PDF may be image-only — try copying text manually or using a DOCX/TXT file.",
      });
      return;
    }

    const resume = await upsertResume(userId, text.trim(), file.originalname);
    res.json(resume);
  } catch (err) {
    console.error("Resume upload error:", err);
    res.status(500).json({ error: "Upload failed. Please try again or use a different file format." });
  }
});

router.delete("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  await deleteResume(userId);
  res.json({ success: true });
});

export default router;
