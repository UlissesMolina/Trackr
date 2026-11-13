import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { EmailSyncEvent, GmailStatus, GmailSyncSummary } from "../types";

export function useGmailStatus() {
  const qc = useQueryClient();
  return useQuery<GmailStatus>({
    queryKey: ["gmail", "status"],
    queryFn: async () => {
      const prev = qc.getQueryData<GmailStatus>(["gmail", "status"]);
      const { data } = await api.get<GmailStatus>("/gmail/status");
      // A background sync just finished: pull in what it changed.
      if (prev?.syncing && !data.syncing) {
        qc.invalidateQueries({ queryKey: ["gmail", "events"] });
        qc.invalidateQueries({ queryKey: ["applications"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }
      return data;
    },
    // Poll while a sync runs (e.g. the first one, started by the connect flow).
    refetchInterval: (query) => (query.state.data?.syncing ? 3000 : false),
  });
}

export function useGmailEvents(enabled: boolean) {
  return useQuery<EmailSyncEvent[]>({
    queryKey: ["gmail", "events"],
    queryFn: async () => {
      const { data } = await api.get("/gmail/events?limit=30");
      return Array.isArray(data) ? data : [];
    },
    enabled,
  });
}

/** Sends the browser through Google's consent screen; it returns to /settings. */
export async function connectGmail() {
  const { data } = await api.get<{ url: string }>("/gmail/connect");
  window.location.href = data.url;
}

function useInvalidateAfterSync() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["gmail"] });
    qc.invalidateQueries({ queryKey: ["applications"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useSyncGmail() {
  const invalidate = useInvalidateAfterSync();
  return useMutation<GmailSyncSummary>({
    mutationFn: async () => (await api.post("/gmail/sync")).data,
    onSettled: invalidate,
  });
}

export function useSetGmailSyncEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (syncEnabled: boolean) => (await api.patch("/gmail", { syncEnabled })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gmail", "status"] }),
  });
}

export function useDisconnectGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.delete("/gmail")).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gmail"] }),
  });
}
