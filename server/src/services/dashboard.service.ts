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
  const underReview = apps.filter((a) => a.status === "UNDER_REVIEW").length;

  const responded = underReview + interviews + offers + rejected;

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
