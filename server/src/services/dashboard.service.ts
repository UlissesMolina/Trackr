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

  // Use current status only — matches the board columns
  const ghostedWaitingCount = applied.filter(
    (a) => a.status === "APPLIED" || a.status === "UNDER_REVIEW"
  ).length;

  const rejectedCount = applied.filter((a) => a.status === "REJECTED").length;
  const interviewCount = applied.filter((a) => a.status === "INTERVIEW").length;
  const offerCount = applied.filter((a) => a.status === "OFFER").length;

  const links: Array<{ source: string; target: string; value: number }> = [];
  if (ghostedWaitingCount > 0) {
    links.push({
      source: FLOW_LABELS.APPLIED,
      target: FLOW_LABELS.GHOSTED_WAITING,
      value: ghostedWaitingCount,
    });
  }
  if (rejectedCount > 0) {
    links.push({
      source: FLOW_LABELS.APPLIED,
      target: FLOW_LABELS.REJECTED,
      value: rejectedCount,
    });
  }
  if (interviewCount > 0) {
    links.push({
      source: FLOW_LABELS.APPLIED,
      target: FLOW_LABELS.INTERVIEW,
      value: interviewCount,
    });
  }
  if (offerCount > 0) {
    links.push({
      source: FLOW_LABELS.INTERVIEW,
      target: FLOW_LABELS.OFFER,
      value: offerCount,
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
