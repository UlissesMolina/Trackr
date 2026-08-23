import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export { clerkMiddleware, requireAuth };

export function getUserId(req: Request): string {
  if ((req as any).extUserId) {
    return (req as any).extUserId;
  }
  const auth = getAuth(req);
  if (!auth?.userId) {
    throw new Error("Unauthorized");
  }
  return auth.userId;
}

export function extTokenAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.EXT_JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { sub: string };
    (req as any).extUserId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
