import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";

export { clerkMiddleware, requireAuth };

export function getUserId(req: Request): string {
  const auth = getAuth(req);
  if (!auth?.userId) {
    throw new Error("Unauthorized");
  }
  return auth.userId;
}
