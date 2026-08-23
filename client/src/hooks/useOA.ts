import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { OnlineAssessment } from "../types";

export function useOA(applicationId: string) {
  return useQuery<OnlineAssessment | null>({
    queryKey: ["oa", applicationId],
    queryFn: async () => {
      const { data } = await api.get(`/applications/${applicationId}/oa`);
      return data;
    },
    enabled: !!applicationId,
  });
}

export function useUpsertOA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      ...body
    }: {
      applicationId: string;
      platform?: string | null;
      dueDate?: string | null;
      status?: "PENDING" | "COMPLETED";
      completedAt?: string | null;
      link?: string | null;
      notes?: string | null;
    }) => {
      const { data } = await api.put(`/applications/${applicationId}/oa`, body);
      return data as OnlineAssessment;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["oa", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["applications", variables.applicationId] });
    },
  });
}

export function useDeleteOA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      await api.delete(`/applications/${applicationId}/oa`);
    },
    onSuccess: (_data, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ["oa", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["applications", applicationId] });
    },
  });
}
