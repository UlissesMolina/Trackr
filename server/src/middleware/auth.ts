import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { verifyApiKey } from "../services/apiKey.service";

export { clerkMiddleware, requireAuth };

export function getUserId(req: Request): string {
  // Check if userId was set by API key auth
  if ((req as any).apiKeyUserId) {
    return (req as any).apiKeyUserId;
  }
  const auth = getAuth(req);
  if (!auth?.userId) {
    throw new Error("Unauthorized");
  }
  return auth.userId;
}

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"];
  if (!key || typeof key !== "string") {
    res.status(401).json({ error: "Missing X-API-Key header" });
    return;
  }

  verifyApiKey(key)
    .then((userId) => {
      if (!userId) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }
      (req as any).apiKeyUserId = userId;
      next();
    })
    .catch(next);
}
