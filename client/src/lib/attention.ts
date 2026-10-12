import type { Application, Interview } from "../types";

export type AttentionKind = "FOLLOW_UP" | "OA" | "INTERVIEW";

export interface AttentionItem {
  kind: AttentionKind;
  key: string;
  application: Application;
  /** Due day or scheduled time; null for an OA with no due date. */
  date: Date | null;
  /** Calendar days until `date` (negative = overdue); null when there's no date. */
  days: number | null;
  interview?: Interview;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const FOLLOW_UP_WINDOW_DAYS = 7;
const INTERVIEW_WINDOW_DAYS = 7;

/**
 * Follow-up and OA due dates are calendar days the server stores as UTC midnight.
 * Read them back as that same day at local midnight so "tomorrow" never looks
 * overdue west of UTC.
 */
function calendarDay(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// round, not floor: a DST change makes one calendar day 23 or 25 hours
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function getAttentionItems(apps: Application[], now: Date): AttentionItem[] {
  const items: AttentionItem[] = [];
  const today = startOfDay(now);

  for (const app of apps) {
    if (app.status === "REJECTED") continue;

    if (app.followUpDate && app.status !== "OFFER") {
      const due = calendarDay(app.followUpDate);
      const days = daysBetween(today, due);
      if (days <= FOLLOW_UP_WINDOW_DAYS) {
        items.push({ kind: "FOLLOW_UP", key: `followup-${app.id}`, application: app, date: due, days });
      }
    }

    const oa = app.onlineAssessment;
    if (oa?.status === "PENDING") {
      const due = oa.dueDate ? calendarDay(oa.dueDate) : null;
      items.push({
        kind: "OA",
        key: `oa-${app.id}`,
        application: app,
        date: due,
        days: due ? daysBetween(today, due) : null,
      });
    }

    for (const interview of app.interviews ?? []) {
      const at = new Date(interview.scheduledAt);
      const msUntil = at.getTime() - now.getTime();
      if (msUntil >= 0 && msUntil <= INTERVIEW_WINDOW_DAYS * DAY_MS) {
        items.push({
          kind: "INTERVIEW",
          key: `interview-${interview.id}`,
          application: app,
          date: at,
          days: Math.floor(msUntil / DAY_MS),
          interview,
        });
      }
    }
  }

  // Most urgent first; undated OAs go last.
  return items.sort((a, b) => {
    if (!a.date || !b.date) return (a.date ? 0 : 1) - (b.date ? 0 : 1);
    return a.date.getTime() - b.date.getTime();
  });
}
