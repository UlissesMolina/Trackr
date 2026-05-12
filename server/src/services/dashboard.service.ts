import prisma from "../lib/prisma";

export async function getStats(clerkUserId: string) {
  const apps = await prisma.application.findMany({
    where: { clerkUserId },
    select: { status: true, createdAt: true, dateApplied: true },
  });

  const total = apps.length;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const applicationsThisWeek = apps.filter((a) => {
    const d = a.dateApplied ?? a.createdAt;
    return new Date(d) >= sevenDaysAgo;
  }).length;

  const rejected = apps.filter((a) => a.status === "REJECTED").length;
  const interviews = apps.filter((a) => a.status === "INTERVIEW").length;
  const offers = apps.filter((a) => a.status === "OFFER").length;

  const responded = interviews + offers + rejected;

  return {
    totalApplications: total,
    applicationsThisWeek,
    responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
    rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
    interviewConversion:
      responded > 0
        ? Math.round(((interviews + offers) / responded) * 100)
        : 0,
    interviewsCount: interviews,
    offersCount: offers,
  };
}

export async function getChartData(clerkUserId: string, days = 7) {
  const apps = await prisma.application.findMany({
    where: { clerkUserId },
    select: { createdAt: true, dateApplied: true },
  });

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const buckets: Record<string, number> = {};

  for (const app of apps) {
    const d = app.dateApplied ?? app.createdAt;
    const dateStr = new Date(d).toISOString().slice(0, 10);
    if (new Date(d) >= cutoff) {
      buckets[dateStr] = (buckets[dateStr] || 0) + 1;
    }
  }

  return Object.entries(buckets)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const FLOW_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  REJECTED: "Rejected",
  GHOSTED_WAITING: "Ghosted / Waiting",
  INTERVIEW: "Interview",
  OFFER: "Offer",
};

const FLOW_NODE_COLORS: Record<string, string> = {
  APPLIED: "#5b8dd9",
  REJECTED: "#ef4444",
  GHOSTED_WAITING: "#94a3b8",
  INTERVIEW: "#f59e0b",
  OFFER: "#5b8dd9",
};

const FLOW_ORDER = ["APPLIED", "GHOSTED_WAITING", "INTERVIEW", "OFFER", "REJECTED"];

/**
 * Builds Sankey data from current application statuses.
 *
 * Every application is counted exactly once, flowing from "Applied" to its
 * current terminal status. This ensures all apps on the board appear in the
 * diagram — no dependency on StatusChange history.
 *
 * Flow logic per app (based on current status):
 *   SAVED              → excluded (not yet applied)
 *   APPLIED/UNDER_REVIEW → Applied → Ghosted / Waiting
 *   INTERVIEW          → Applied → Interview
 *   OFFER              → Applied → Interview → Offer
 *   REJECTED           → we check StatusChange to see if they got an interview:
 *                           yes → Applied → Interview → Rejected
 *                           no  → Applied → Rejected
 */
export async function getSankeyData(clerkUserId: string) {
  const apps = await prisma.application.findMany({
    where: { clerkUserId },
    select: { id: true, status: true },
  });

  // For REJECTED apps, check if they ever reached INTERVIEW to determine the path
  const rejectedIds = apps.filter((a) => a.status === "REJECTED").map((a) => a.id);
  const interviewedRejectedIds = new Set<string>();

  if (rejectedIds.length > 0) {
    const changes = await prisma.statusChange.findMany({
      where: {
        applicationId: { in: rejectedIds },
        toStatus: "INTERVIEW",
      },
      select: { applicationId: true },
      distinct: ["applicationId"],
    });
    for (const c of changes) interviewedRejectedIds.add(c.applicationId);
  }

  // Tally links
  const linkCounts = new Map<string, number>();
  const addLink = (from: string, to: string) => {
    const key = `${FLOW_LABELS[from]}||${FLOW_LABELS[to]}`;
    linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
  };

  for (const app of apps) {
    switch (app.status) {
      case "SAVED":
        // Not yet applied — exclude from funnel
        break;

      case "APPLIED":
      case "UNDER_REVIEW":
        // Still waiting — Applied → Ghosted / Waiting
        addLink("APPLIED", "GHOSTED_WAITING");
        break;

      case "INTERVIEW":
        // In interview process — Applied → Interview
        addLink("APPLIED", "INTERVIEW");
        break;

      case "OFFER":
        // Got an offer — Applied → Interview → Offer
        addLink("APPLIED", "INTERVIEW");
        addLink("INTERVIEW", "OFFER");
        break;

      case "REJECTED":
        if (interviewedRejectedIds.has(app.id)) {
          // Rejected after interview — Applied → Interview → Rejected
          addLink("APPLIED", "INTERVIEW");
          addLink("INTERVIEW", "REJECTED");
        } else {
          // Rejected without interview — Applied → Rejected
          addLink("APPLIED", "REJECTED");
        }
        break;
    }
  }

  // Build links array
  const links: Array<{ source: string; target: string; value: number }> = [];
  for (const [key, value] of linkCounts) {
    const [source, target] = key.split("||");
    links.push({ source, target, value });
  }

  if (links.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodeIds = new Set(links.flatMap((l) => [l.source, l.target]));
  const nodes = FLOW_ORDER.filter((id) => nodeIds.has(FLOW_LABELS[id])).map(
    (key) => ({
      id: FLOW_LABELS[key],
      nodeColor: FLOW_NODE_COLORS[key] ?? "#94a3b8",
    })
  );

  return { nodes, links };
}
