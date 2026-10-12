import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Application } from "../types";

export function useAnalyzeMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data } = await api.post<Application>(`/ai/match/${applicationId}`);
      return data;
    },
    onSuccess: (app) => {
      queryClient.setQueryData(["applications", app.id], app);
      queryClient.invalidateQueries({ queryKey: ["applications"], exact: true });
    },
  });
}

export function useFollowUpEmail() {
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data } = await api.post<{ email: string }>("/ai/follow-up-email", { applicationId });
      return data.email;
    },
  });
}
