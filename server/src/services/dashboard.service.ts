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
  APPLIED: "#10b981",
  REJECTED: "#ef4444",
  GHOSTED_WAITING: "#94a3b8",
  INTERVIEW: "#f59e0b",
  OFFER: "#10b981",
};

const FLOW_ORDER = ["APPLIED", "GHOSTED_WAITING", "INTERVIEW", "OFFER", "REJECTED"];

// Rank determines allowed flow direction — links may only go from lower to higher rank.
// Equal-rank links are dropped to prevent cycles.
const FLOW_RANK: Record<string, number> = {
  APPLIED: 0,
  GHOSTED_WAITING: 1,
  INTERVIEW: 1,
  OFFER: 2,
  REJECTED: 2,
};

export async function getSankeyData(clerkUserId: string) {
  // Get actual status transitions from history
  const changes = await prisma.statusChange.findMany({
    where: { application: { clerkUserId } },
    select: { applicationId: true, fromStatus: true, toStatus: true },
  });

  // Get current status of all apps to identify "ghosted" ones
  const apps = await prisma.application.findMany({
    where: { clerkUserId },
    select: { id: true, status: true },
  });

  // Normalize status to Sankey label key
  const toKey = (status: string): string | null => {
    if (status === "SAVED") return null;
    if (status === "APPLIED" || status === "UNDER_REVIEW") return "APPLIED";
    return status; // INTERVIEW, OFFER, REJECTED
  };

  // Aggregate transitions into link counts — only forward transitions allowed
  const linkCounts = new Map<string, number>();
  for (const { fromStatus, toStatus } of changes) {
    const from = toKey(fromStatus);
    const to = toKey(toStatus);
    if (!from || !to || from === to) continue;
    // Skip backward transitions that would create cycles in the Sankey diagram
    if ((FLOW_RANK[from] ?? 0) >= (FLOW_RANK[to] ?? 0)) continue;
    const key = `${FLOW_LABELS[from]}||${FLOW_LABELS[to]}`;
    linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
  }

  // Find apps that have outgoing transitions from Applied
  const appsWithOutgoingIds = new Set(
    changes
      .filter((c) => toKey(c.fromStatus) === "APPLIED" && toKey(c.toStatus) !== null && toKey(c.toStatus) !== "APPLIED")
      .map((c) => c.applicationId)
  );

  const ghostedCount = apps.filter(
    (a) =>
      (a.status === "APPLIED" || a.status === "UNDER_REVIEW") &&
      !appsWithOutgoingIds.has(a.id)
  ).length;

  if (ghostedCount > 0) {
    const key = `${FLOW_LABELS.APPLIED}||${FLOW_LABELS.GHOSTED_WAITING}`;
    linkCounts.set(key, (linkCounts.get(key) || 0) + ghostedCount);
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
