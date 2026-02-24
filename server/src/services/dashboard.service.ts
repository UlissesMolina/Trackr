import prisma from "../lib/prisma";

export async function getStats(clerkUserId: string) {
  const apps = await prisma.application.findMany({
    where: { clerkUserId },
    select: { status: true },
  });

  const total = apps.length;
  if (total === 0) {
    return {
      totalApplications: 0,
      responseRate: 0,
      rejectionRate: 0,
      interviewConversion: 0,
    };
  }

  const rejected = apps.filter((a) => a.status === "REJECTED").length;
  const interviews = apps.filter((a) => a.status === "INTERVIEW").length;
  const offers = apps.filter((a) => a.status === "OFFER").length;

  const responded = interviews + offers + rejected;

  return {
    totalApplications: total,
    responseRate: Math.round((responded / total) * 100),
    rejectionRate: Math.round((rejected / total) * 100),
    interviewConversion: responded > 0
      ? Math.round(((interviews + offers) / responded) * 100)
      : 0,
  };
}

export async function getChartData(clerkUserId: string) {
  const apps = await prisma.application.findMany({
    where: { clerkUserId },
    select: { createdAt: true, dateApplied: true },
  });

  const buckets: Record<string, number> = {};

  for (const app of apps) {
    const date = (app.dateApplied ?? app.createdAt).toISOString().slice(0, 10);
    buckets[date] = (buckets[date] || 0) + 1;
  }

  return Object.entries(buckets)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const FLOW_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  REJECTED: "Rejected",
  GHOSTED_WAITING: "Ghosted / Waiting",
};

const FLOW_NODE_COLORS: Record<string, string> = {
  APPLIED: "#10b981",
  REJECTED: "#ef4444",
  GHOSTED_WAITING: "#94a3b8",
};

const FLOW_ORDER = ["APPLIED", "REJECTED", "GHOSTED_WAITING"];

export async function getSankeyData(clerkUserId: string) {
  const applications = await prisma.application.findMany({
    where: { clerkUserId },
    select: { status: true },
  });

  // Only include applications that have been applied (exclude SAVED)
  const applied = applications.filter(
    (a) =>
      a.status === "APPLIED" ||
      a.status === "UNDER_REVIEW" ||
      a.status === "INTERVIEW" ||
      a.status === "OFFER" ||
      a.status === "REJECTED"
  );

  if (applied.length === 0) {
    return { nodes: [], links: [] };
  }

  const rejectedCount = applied.filter((a) => a.status === "REJECTED").length;
  const ghostedWaitingCount = applied.filter(
    (a) =>
      a.status === "APPLIED" ||
      a.status === "UNDER_REVIEW" ||
      a.status === "INTERVIEW" ||
      a.status === "OFFER"
  ).length;

  const links: Array<{ source: string; target: string; value: number }> = [];
  if (rejectedCount > 0) {
    links.push({
      source: FLOW_LABELS.APPLIED,
      target: FLOW_LABELS.REJECTED,
      value: rejectedCount,
    });
  }
  if (ghostedWaitingCount > 0) {
    links.push({
      source: FLOW_LABELS.APPLIED,
      target: FLOW_LABELS.GHOSTED_WAITING,
      value: ghostedWaitingCount,
    });
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
