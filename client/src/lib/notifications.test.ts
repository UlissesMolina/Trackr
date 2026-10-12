import { describe, it, expect } from "vitest";
import { getNotifications } from "./notifications";
import type { Application, Interview, OnlineAssessment } from "../types";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-11T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY).toISOString();
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * DAY).toISOString();
const pad = (n: number) => String(n).padStart(2, "0");

/** An OA due date as the server stores it: the calendar day at UTC midnight. */
function dayOn(offsetDays: number): string {
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
    dueDate: dayOn(2),
    status: "PENDING",
    completedAt: null,
    link: null,
    notes: null,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    ...overrides,
  };
}

describe("getNotifications", () => {
  it("returns nothing for an application with no OA or interviews", () => {
    expect(getNotifications([makeApp()], NOW)).toEqual([]);
  });

  it("ignores follow-up dates", () => {
    expect(getNotifications([makeApp({ followUpDate: dayOn(-3) })], NOW)).toEqual([]);
  });

  it("includes every pending OA: overdue, soon, later, and undated", () => {
    const apps = [
      makeApp({ id: "overdue", onlineAssessment: makeOA({ dueDate: dayOn(-2) }) }),
      makeApp({ id: "soon", onlineAssessment: makeOA({ dueDate: dayOn(2) }) }),
      makeApp({ id: "later", onlineAssessment: makeOA({ dueDate: dayOn(20) }) }),
      makeApp({ id: "undated", onlineAssessment: makeOA({ dueDate: null }) }),
    ];
    const items = getNotifications(apps, NOW);
    expect(items.map((i) => [i.application.id, i.kind, i.days])).toEqual([
      ["overdue", "OA", -2],
      ["soon", "OA", 2],
      ["later", "OA", 20],
      ["undated", "OA", null],
    ]);
    expect(items[3].date).toBeNull();
  });

  it("treats OA due dates as local calendar days, not UTC instants", () => {
    const lateTonight = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 23, 30);
    const earlyThisMorning = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 0, 30);
    const due = (n: number) => makeApp({ onlineAssessment: makeOA({ dueDate: dayOn(n) }) });
    expect(getNotifications([due(1)], lateTonight)[0].days).toBe(1);
    expect(getNotifications([due(0)], lateTonight)[0].days).toBe(0);
    expect(getNotifications([due(-1)], earlyThisMorning)[0].days).toBe(-1);
  });

  it("ignores completed OAs", () => {
    expect(getNotifications([makeApp({ onlineAssessment: makeOA({ status: "COMPLETED" }) })], NOW)).toEqual([]);
  });

  it("includes interviews in the next 7 days only", () => {
    const app = makeApp({
      status: "INTERVIEW",
      interviews: [
        makeInterview({ id: "soon", scheduledAt: daysFromNow(3) }),
        makeInterview({ id: "later", scheduledAt: daysFromNow(8) }),
        makeInterview({ id: "past", scheduledAt: daysAgo(1) }),
      ],
    });
    const items = getNotifications([app], NOW);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "INTERVIEW", days: 3 });
    expect(items[0].interview?.id).toBe("soon");
  });

  it("returns nothing for REJECTED applications", () => {
    const app = makeApp({ status: "REJECTED", onlineAssessment: makeOA(), interviews: [makeInterview()] });
    expect(getNotifications([app], NOW)).toEqual([]);
  });

  it("sorts by date, most urgent first, with undated OAs last", () => {
    const apps = [
      makeApp({ id: "oa-undated", onlineAssessment: makeOA({ dueDate: null }) }),
      makeApp({ id: "oa-later", onlineAssessment: makeOA({ dueDate: dayOn(4) }) }),
      makeApp({ id: "interview", status: "INTERVIEW", interviews: [makeInterview({ scheduledAt: daysFromNow(2) })] }),
      makeApp({ id: "oa-overdue", onlineAssessment: makeOA({ dueDate: dayOn(-1) }) }),
      makeApp({ id: "oa-undated-2", onlineAssessment: makeOA({ dueDate: null }) }),
    ];
    const ids = getNotifications(apps, NOW).map((i) => i.application.id);
    expect(ids).toEqual(["oa-overdue", "interview", "oa-later", "oa-undated", "oa-undated-2"]);
  });

  it("gives every item a unique key", () => {
    const app = makeApp({
      status: "INTERVIEW",
      onlineAssessment: makeOA(),
      interviews: [makeInterview({ id: "i1" }), makeInterview({ id: "i2", scheduledAt: daysFromNow(4) })],
    });
    const keys = getNotifications([app], NOW).map((i) => i.key);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
