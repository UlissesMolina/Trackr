import { describe, it, expect } from "vitest";
import { getAttentionItems, isStale, daysSinceActivity } from "./attention";
import type { Application, Interview, OnlineAssessment } from "../types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-11T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY).toISOString();
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * DAY).toISOString();
const pad = (n: number) => String(n).padStart(2, "0");

/** A follow-up date as the server stores it: the calendar day at UTC midnight. */
function followUpOn(offsetDays: number): string {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00.000Z`;
}

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    clerkUserId: "user-1",
    title: "Software Engineer",
    company: "Acme",
    location: null,
    salaryMin: null,
    salaryMax: null,
    url: null,
    status: "APPLIED",
    priority: null,
    dateApplied: null,
    followUpDate: null,
    rejectionDate: null,
    jobDescription: null,
    coverLetter: null,
    statusChangedAt: daysAgo(1),
    matchAnalysis: null,
    matchAnalyzedAt: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    interviews: [],
    onlineAssessment: null,
    ...overrides,
  };
}

function makeInterview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: "int-1",
    applicationId: "app-1",
    type: "TECHNICAL",
    scheduledAt: daysFromNow(2),
    location: null,
    notes: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    ...overrides,
  };
}

function makeOA(overrides: Partial<OnlineAssessment> = {}): OnlineAssessment {
  return {
    id: "oa-1",
    applicationId: "app-1",
    platform: "HackerRank",
    dueDate: daysFromNow(2),
    status: "PENDING",
    completedAt: null,
    link: null,
    notes: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    ...overrides,
  };
}

describe("daysSinceActivity", () => {
  it("uses the most recent of statusChangedAt, dateApplied, createdAt", () => {
    const app = makeApp({ createdAt: daysAgo(40), dateApplied: daysAgo(30), statusChangedAt: daysAgo(10) });
    expect(daysSinceActivity(app, NOW)).toBe(10);
  });

  it("falls back to createdAt when the other dates are null", () => {
    const app = makeApp({ createdAt: daysAgo(25), dateApplied: null, statusChangedAt: null });
    expect(daysSinceActivity(app, NOW)).toBe(25);
  });
});

describe("isStale", () => {
  it("is stale when APPLIED with no activity for more than staleDays", () => {
    expect(isStale(makeApp({ statusChangedAt: daysAgo(22), createdAt: daysAgo(22) }), NOW, 21)).toBe(true);
  });

  it("is not stale at exactly staleDays", () => {
    expect(isStale(makeApp({ statusChangedAt: daysAgo(21), createdAt: daysAgo(21) }), NOW, 21)).toBe(false);
  });

  it("counts UNDER_REVIEW as stale-able", () => {
    const app = makeApp({ status: "UNDER_REVIEW", statusChangedAt: daysAgo(30), createdAt: daysAgo(30) });
    expect(isStale(app, NOW, 21)).toBe(true);
  });

  it.each(["SAVED", "INTERVIEW", "OFFER", "REJECTED"] as const)("never marks %s as stale", (status) => {
    const app = makeApp({ status, statusChangedAt: daysAgo(90), createdAt: daysAgo(90) });
    expect(isStale(app, NOW, 21)).toBe(false);
  });

  it("is snoozed by a future followUpDate", () => {
    const app = makeApp({ statusChangedAt: daysAgo(30), createdAt: daysAgo(30), followUpDate: followUpOn(3) });
    expect(isStale(app, NOW, 21)).toBe(false);
  });

  it("is snoozed by a follow-up due today", () => {
    const app = makeApp({ statusChangedAt: daysAgo(30), createdAt: daysAgo(30), followUpDate: followUpOn(0) });
    expect(isStale(app, NOW, 21)).toBe(false);
  });

  it("is not snoozed by a past followUpDate", () => {
    const app = makeApp({ statusChangedAt: daysAgo(30), createdAt: daysAgo(30), followUpDate: followUpOn(-1) });
    expect(isStale(app, NOW, 21)).toBe(true);
  });

  it("respects a custom threshold", () => {
    const app = makeApp({ statusChangedAt: daysAgo(8), createdAt: daysAgo(8) });
    expect(isStale(app, NOW, 7)).toBe(true);
    expect(isStale(app, NOW, 21)).toBe(false);
  });
});

describe("getAttentionItems", () => {
  it("returns nothing for a fresh application", () => {
    expect(getAttentionItems([makeApp()], NOW, 21)).toEqual([]);
  });

  it("flags an overdue follow-up with days overdue", () => {
    const items = getAttentionItems([makeApp({ followUpDate: followUpOn(-3) })], NOW, 21);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "FOLLOW_UP_OVERDUE", days: 3 });
  });

  it("treats followUpDate as a local calendar day, not a UTC instant", () => {
    const lateTonight = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 23, 30);
    const earlyThisMorning = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 0, 30);
    // Due tomorrow: never overdue today, whatever the timezone.
    expect(getAttentionItems([makeApp({ followUpDate: followUpOn(1) })], lateTonight, 21)).toEqual([]);
    // Due today: not overdue yet, even late in the evening.
    expect(getAttentionItems([makeApp({ followUpDate: followUpOn(0) })], lateTonight, 21)).toEqual([]);
    // Due yesterday: overdue by 1 day, even just after midnight.
    const items = getAttentionItems([makeApp({ followUpDate: followUpOn(-1) })], earlyThisMorning, 21);
    expect(items[0]).toMatchObject({ kind: "FOLLOW_UP_OVERDUE", days: 1 });
  });

  it("ignores overdue follow-ups on OFFER applications", () => {
    expect(getAttentionItems([makeApp({ status: "OFFER", followUpDate: followUpOn(-3) })], NOW, 21)).toEqual([]);
  });

  it("flags a pending OA due within 3 days", () => {
    const items = getAttentionItems([makeApp({ onlineAssessment: makeOA({ dueDate: daysFromNow(2) }) })], NOW, 21);
    expect(items[0]).toMatchObject({ kind: "OA_DUE_SOON", days: 2 });
  });

  it("flags a past-due pending OA with negative days", () => {
    const items = getAttentionItems([makeApp({ onlineAssessment: makeOA({ dueDate: daysAgo(2) }) })], NOW, 21);
    expect(items[0]).toMatchObject({ kind: "OA_DUE_SOON", days: -2 });
  });

  it("ignores OAs due later than 3 days, completed, or without a due date", () => {
    const apps = [
      makeApp({ id: "a", onlineAssessment: makeOA({ dueDate: daysFromNow(4) }) }),
      makeApp({ id: "b", onlineAssessment: makeOA({ status: "COMPLETED" }) }),
      makeApp({ id: "c", onlineAssessment: makeOA({ dueDate: null }) }),
    ];
    expect(getAttentionItems(apps, NOW, 21)).toEqual([]);
  });

  it("flags interviews in the next 7 days only", () => {
    const app = makeApp({
      status: "INTERVIEW",
      interviews: [
        makeInterview({ id: "soon", scheduledAt: daysFromNow(3) }),
        makeInterview({ id: "later", scheduledAt: daysFromNow(8) }),
        makeInterview({ id: "past", scheduledAt: daysAgo(1) }),
      ],
    });
    const items = getAttentionItems([app], NOW, 21);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "INTERVIEW_SOON", days: 3 });
    expect(items[0].interview?.id).toBe("soon");
  });

  it("flags stale applications with days since activity", () => {
    const items = getAttentionItems([makeApp({ statusChangedAt: daysAgo(30), createdAt: daysAgo(30) })], NOW, 21);
    expect(items[0]).toMatchObject({ kind: "STALE", days: 30 });
  });

  it("returns nothing for REJECTED applications", () => {
    const app = makeApp({
      status: "REJECTED",
      followUpDate: followUpOn(-3),
      onlineAssessment: makeOA(),
      interviews: [makeInterview()],
    });
    expect(getAttentionItems([app], NOW, 21)).toEqual([]);
  });

  it("can return multiple items for one application", () => {
    const app = makeApp({
      statusChangedAt: daysAgo(30),
      createdAt: daysAgo(30),
      followUpDate: followUpOn(-2),
      onlineAssessment: makeOA(),
    });
    const kinds = getAttentionItems([app], NOW, 21).map((i) => i.kind);
    expect(kinds).toEqual(["FOLLOW_UP_OVERDUE", "OA_DUE_SOON", "STALE"]);
  });

  it("sorts by kind, then by date ascending within a kind", () => {
    const apps = [
      makeApp({ id: "stale-newer", statusChangedAt: daysAgo(25), createdAt: daysAgo(25) }),
      makeApp({ id: "stale-older", statusChangedAt: daysAgo(40), createdAt: daysAgo(40) }),
      makeApp({ id: "interview", status: "INTERVIEW", interviews: [makeInterview({ applicationId: "interview" })] }),
      makeApp({ id: "followup", status: "INTERVIEW", followUpDate: followUpOn(-1) }),
    ];
    const ids = getAttentionItems(apps, NOW, 21).map((i) => i.application.id);
    expect(ids).toEqual(["followup", "interview", "stale-older", "stale-newer"]);
  });

  it("gives every item a unique key", () => {
    const app = makeApp({
      status: "INTERVIEW",
      interviews: [makeInterview({ id: "i1" }), makeInterview({ id: "i2", scheduledAt: daysFromNow(4) })],
    });
    const keys = getAttentionItems([app], NOW, 21).map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
