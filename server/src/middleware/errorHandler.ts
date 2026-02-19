import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err.stack);

  if (err.message === "Unauthorized") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}
