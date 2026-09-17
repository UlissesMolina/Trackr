import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[${req.method} ${req.path}]`, err.message, err.stack);

  // Malformed JSON, oversized bodies, etc. from express.json()
  const status = (err as { status?: number }).status;
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ error: status === 413 ? "Request body too large" : "Invalid request body" });
    return;
  }

  const prismaCode = (err as { code?: string }).code;
  if (prismaCode === "P2002") {
    res.status(409).json({ error: "That already exists" });
    return;
  }
  if (prismaCode === "P2025") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (err.message === "Unauthorized") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (err.message.includes("quota") || err.message.includes("429")) {
    res.status(503).json({
      error: "AI service is temporarily unavailable. Please check your OpenAI API quota at platform.openai.com.",
    });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}
