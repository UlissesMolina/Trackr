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
      return Array.isArray(data) ? data : [];
    },
  });
}

export interface SankeyNode {
  id: string;
  nodeColor: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export function useSankeyData() {
  return useQuery<SankeyData>({
    queryKey: ["dashboard", "sankey"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/sankey");
      const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
      const links = Array.isArray(data?.links) ? data.links : [];
      return { nodes, links };
    },
  });
}
