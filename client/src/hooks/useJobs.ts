import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export interface JobListing {
  id: string;
  company_name: string;
  company_url: string;
  title: string;
  url: string;
  locations: string[];
  // When SimplifyJobs added the listing (Unix seconds), not when the company posted it.
  date_posted: number;
  category?: string;
}

export function useJobs(options: {
  category?: string;
  roleType?: string;
  search?: string;
  usOnly?: boolean;
  postedWithin?: "7d" | "14d" | "30d" | "all";
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["jobs", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.category) params.set("category", options.category);
      if (options.roleType) params.set("roleType", options.roleType);
      if (options.search) params.set("search", options.search);
      if (options.usOnly) params.set("usOnly", "true");
      if (options.postedWithin) params.set("postedWithin", options.postedWithin);
      if (options.limit) params.set("limit", String(options.limit));
      if (options.offset) params.set("offset", String(options.offset));
      const { data } = await api.get(`/jobs?${params}`);
      return data as { jobs: JobListing[]; total: number };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Company publish dates (Unix seconds, or null if unknown) for the given
 * listing ids. Loaded separately so the job list never waits on job boards.
 */
export function usePostedDates(ids: string[]) {
  return useQuery({
    queryKey: ["jobs", "posted-dates", ids],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/posted-dates?ids=${encodeURIComponent(ids.join(","))}`);
      return data.dates as Record<string, number | null>;
    },
    enabled: ids.length > 0,
    staleTime: 60 * 60 * 1000,
  });
}
