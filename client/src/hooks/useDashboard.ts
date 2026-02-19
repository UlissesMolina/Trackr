import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { DashboardStats } from "../types";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/stats");
      return data;
    },
  });
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export function useDashboardChart() {
  return useQuery<ChartDataPoint[]>({
    queryKey: ["dashboard", "chart"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/chart");
      return data;
    },
  });
}
