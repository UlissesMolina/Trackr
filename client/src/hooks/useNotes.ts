import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Note } from "../types";

export function useNotes(applicationId: string) {
  return useQuery<Note[]>({
    queryKey: ["notes", applicationId],
    queryFn: async () => {
      const { data } = await api.get(`/applications/${applicationId}/notes`);
      return data;
    },
    enabled: !!applicationId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      content,
    }: {
      applicationId: string;
      content: string;
    }) => {
      const { data } = await api.post(`/applications/${applicationId}/notes`, {
        content,
      });
      return data as Note;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", variables.applicationId],
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      noteId,
    }: {
      applicationId: string;
      noteId: string;
    }) => {
      await api.delete(`/applications/${applicationId}/notes/${noteId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["notes", variables.applicationId],
      });
    },
  });
}
