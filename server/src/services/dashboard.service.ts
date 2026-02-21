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
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const buckets: Record<string, number> = {};

  for (const app of apps) {
    const date = app.createdAt.toISOString().slice(0, 10);
    buckets[date] = (buckets[date] || 0) + 1;
  }

  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

const STATUS_LABEL: Record<string, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STATUS_NODE_COLOR: Record<string, string> = {
  SAVED: "#71717a",
  APPLIED: "#6366f1",
  INTERVIEW: "#8b5cf6",
  OFFER: "#10b981",
  REJECTED: "#ef4444",
};

const STATUS_ORDER = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

export async function getSankeyData(clerkUserId: string) {
  const applications = await prisma.application.findMany({
    where: { clerkUserId },
    select: {
      status: true,
      statusChanges: {
        orderBy: { changedAt: "desc" },
        take: 1,
        select: { fromStatus: true },
      },
    },
  });

  if (applications.length === 0) {
    return { nodes: [], links: [] };
  }

  const PIPELINE = ["SAVED", "APPLIED", "INTERVIEW", "OFFER"];
  const pipelineRank = new Map(PIPELINE.map((s, i) => [s, i]));
  const linkCounts = new Map<string, number>();

  const addLink = (from: string, to: string) => {
    const key = `${from}::${to}`;
    linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
  };

  const normalize = (s: string) => (s === "UNDER_REVIEW" ? "APPLIED" : s);

  for (const app of applications) {
    const status = normalize(app.status);

    if (status === "REJECTED") {
      const fromStatus = normalize(app.statusChanges[0]?.fromStatus ?? "APPLIED");
      const fromRank = pipelineRank.get(fromStatus) ?? 1;

      for (let i = 0; i < fromRank; i++) {
        addLink(PIPELINE[i], PIPELINE[i + 1]);
      }
      addLink(fromStatus, "REJECTED");
    } else {
      const rank = pipelineRank.get(status) ?? 0;
      for (let i = 0; i < rank; i++) {
        addLink(PIPELINE[i], PIPELINE[i + 1]);
      }
    }
  }

  if (linkCounts.size === 0) {
    return { nodes: [], links: [] };
  }

  const nodeIds = new Set<string>();
  const links: Array<{ source: string; target: string; value: number }> = [];

  for (const [key, value] of linkCounts) {
    const [from, to] = key.split("::");
    const sourceLabel = STATUS_LABEL[from] || from;
    const targetLabel = STATUS_LABEL[to] || to;

    nodeIds.add(sourceLabel);
    nodeIds.add(targetLabel);
    links.push({ source: sourceLabel, target: targetLabel, value });
  }

  const statusOrderMap = new Map(
    STATUS_ORDER.map((s, i) => [STATUS_LABEL[s], i])
  );

  const nodes = Array.from(nodeIds)
    .sort((a, b) => (statusOrderMap.get(a) ?? 99) - (statusOrderMap.get(b) ?? 99))
    .map((id) => {
      const enumKey = Object.entries(STATUS_LABEL).find(([, v]) => v === id)?.[0];
      return {
        id,
        nodeColor: enumKey ? STATUS_NODE_COLOR[enumKey] : "#94a3b8",
      };
    });

  return { nodes, links };
}
