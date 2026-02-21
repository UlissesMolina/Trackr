import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Interview } from "../types";
import type { InterviewType } from "../lib/constants";

export function useInterviews(applicationId: string) {
  return useQuery<Interview[]>({
    queryKey: ["interviews", applicationId],
    queryFn: async () => {
      const { data } = await api.get(`/applications/${applicationId}/interviews`);
      return data;
    },
    enabled: !!applicationId,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      applicationId: string;
      type: InterviewType;
      scheduledAt: string;
      location?: string;
      notes?: string;
    }) => {
      const { applicationId, ...rest } = body;
      const { data } = await api.post(`/applications/${applicationId}/interviews`, rest);
      return data as Interview;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["interviews", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["applications", variables.applicationId] });
    },
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      interviewId,
      ...body
    }: {
      applicationId: string;
      interviewId: string;
      type?: InterviewType;
      scheduledAt?: string;
      location?: string | null;
      notes?: string | null;
    }) => {
      const { data } = await api.patch(
        `/applications/${applicationId}/interviews/${interviewId}`,
        body
      );
      return data as Interview;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["interviews", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["applications", variables.applicationId] });
    },
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      interviewId,
    }: {
      applicationId: string;
      interviewId: string;
    }) => {
      await api.delete(`/applications/${applicationId}/interviews/${interviewId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["interviews", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["applications", variables.applicationId] });
    },
  });
}
