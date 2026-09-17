import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  ApplicationStatus,
  ApplicationPriority,
  InterviewType,
  OAStatus,
} from "../../generated/prisma/enums";

/**
 * Validate req.body against a schema. On success req.body is replaced with the
 * parsed result, so unknown fields (e.g. clerkUserId, id) never reach a service.
 */
export function validateBody(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue.path.join(".");
      res.status(400).json({
        error: path ? `${path}: ${issue.message}` : issue.message,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

const text = (max: number) =>
  z.string().trim().max(max, `must be at most ${max.toLocaleString("en-US")} characters`);
const requiredText = (max: number) => text(max).min(1, "is required");
const optionalText = (max: number) => text(max).nullish();

// Date inputs arrive as "YYYY-MM-DD" or ISO strings; "" means cleared.
const dateString = z
  .string()
  .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), "must be a valid date")
  .nullish();

const salary = z.number().finite().nonnegative().max(100_000_000).transform(Math.round).nullish();

const status = z.enum(ApplicationStatus);
const priority = z.enum(ApplicationPriority).nullish();

// ── Applications ───────────────────────────────────────────

const applicationFields = {
  title: requiredText(300),
  company: requiredText(300),
  location: optionalText(300),
  salaryMin: salary,
  salaryMax: salary,
  url: optionalText(2000),
  jobDescription: optionalText(50_000),
  priority,
  dateApplied: dateString,
  followUpDate: dateString,
  rejectionDate: dateString,
};

export const createApplicationSchema = z.object({
  ...applicationFields,
  location: text(300).optional(),
  url: text(2000).optional(),
  jobDescription: text(50_000).optional(),
  status: status.optional(),
});

// Status is deliberately absent: it changes via PATCH /:id/status so history is recorded.
export const updateApplicationSchema = z.object({
  ...applicationFields,
  coverLetter: optionalText(20_000),
}).partial();

export const updateStatusSchema = z.object({ status });

// Imported rows come from CSVs and AI extraction, so bad optional values are
// dropped instead of failing the whole import.
const importRowSchema = z.object({
  title: requiredText(300),
  company: requiredText(300),
  location: text(300).optional().catch(undefined),
  salaryMin: salary.catch(undefined),
  salaryMax: salary.catch(undefined),
  url: text(2000).optional().catch(undefined),
  status: z
    .preprocess((v) => (typeof v === "string" ? v.trim().toUpperCase().replace(/[\s-]+/g, "_") : v), status)
    .optional()
    .catch(undefined),
  priority: priority.catch(undefined),
  dateApplied: dateString.catch(undefined),
});

export const importApplicationsSchema = z.object({
  applications: z.array(importRowSchema).min(1, "must not be empty").max(1000),
});

// ── Notes, interviews, OAs, tags ───────────────────────────

export const createNoteSchema = z.object({ content: requiredText(10_000) });

export const createInterviewSchema = z.object({
  type: z.enum(InterviewType),
  scheduledAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "must be a valid date"),
  location: text(500).optional(),
  notes: text(10_000).optional(),
});

export const updateInterviewSchema = createInterviewSchema
  .extend({ location: optionalText(500), notes: optionalText(10_000) })
  .partial();

export const upsertOASchema = z.object({
  platform: optionalText(200),
  dueDate: dateString,
  status: z.enum(OAStatus).optional(),
  completedAt: dateString,
  link: optionalText(2000),
  notes: optionalText(10_000),
});

export const createTagSchema = z.object({
  name: requiredText(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "must be a hex color like #10b981").optional(),
});

export const addTagSchema = z.object({ tagId: requiredText(100) });

// ── Resume & AI ────────────────────────────────────────────

export const saveResumeSchema = z.object({ content: requiredText(30_000) });

// Caps keep OpenAI requests (and cost) bounded.
export const AI_LIMITS = {
  jobDescription: 15_000,
  resumeText: 20_000,
  emailText: 20_000,
};

export const coverLetterSchema = z.object({
  jobDescription: text(AI_LIMITS.jobDescription).optional(),
  resumeText: text(AI_LIMITS.resumeText).optional(),
  jobTitle: text(300).optional(),
  company: text(300).optional(),
  applicationId: text(100).optional(),
});

export const extractEmailSchema = z.object({
  emailText: text(AI_LIMITS.emailText).min(10, "must be at least 10 characters"),
});
