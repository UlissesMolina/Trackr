import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[${req.method} ${req.path}]`, err.message, err.stack);

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
