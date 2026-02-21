import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Application } from "../types";
import type { ApplicationStatus } from "../lib/constants";

export function useApplications() {
  return useQuery<Application[]>({
    queryKey: ["applications"],
    queryFn: async () => {
      const { data } = await api.get("/applications");
      return data;
    },
  });
}

export function useApplication(id: string) {
  return useQuery<Application>({
    queryKey: ["applications", id],
    queryFn: async () => {
      const { data } = await api.get(`/applications/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      title: string;
      company: string;
      location?: string;
      salaryMin?: number;
      salaryMax?: number;
      url?: string;
      status?: ApplicationStatus;
      dateApplied?: string;
      followUpDate?: string;
    }) => {
      const { data } = await api.post("/applications", body);
      return data as Application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      company?: string;
      location?: string | null;
      salaryMin?: number | null;
      salaryMax?: number | null;
      url?: string | null;
      dateApplied?: string | null;
      followUpDate?: string | null;
      coverLetter?: string | null;
    }) => {
      const { data } = await api.patch(`/applications/${id}`, body);
      return data as Application;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", variables.id] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const { data } = await api.patch(`/applications/${id}/status`, { status });
      return data as Application;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", variables.id] });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
