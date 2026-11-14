import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, RefreshCw, Unplug, ExternalLink } from "lucide-react";
import {
  connectGmail,
  useDisconnectGmail,
  useGmailEvents,
  useGmailStatus,
  useSetGmailSyncEnabled,
  useSyncGmail,
} from "../../hooks/useGmail";
import type { EmailSyncEvent, GmailSyncSummary } from "../../types";
import { formatDateTime, formatShortDate } from "../../lib/utils";

const ACTION_LABEL: Record<EmailSyncEvent["action"], { label: string; cls: string }> = {
  CREATED: { label: "Added", cls: "bg-blue-500/12 text-blue-400" },
  STATUS_UPDATED: { label: "Updated", cls: "bg-green-500/12 text-green-400" },
  OA_ADDED: { label: "OA", cls: "bg-purple-500/20 text-purple-400" },
  UNMATCHED: { label: "No match", cls: "bg-amber-500/12 text-amber-400" },
  IGNORED: { label: "Skipped", cls: "bg-surface-elevated text-text-tertiary" },
};

const CLASS_LABEL: Record<string, string> = {
  APPLIED: "Application received",
  REJECTED: "Rejection",
  INTERVIEW: "Interview",
  OA: "Assessment",
  OFFER: "Offer",
};

function summarize(s: GmailSyncSummary): string {
  if (s.scanned === 0) return "Nothing new since the last sync.";
  const parts = [`${s.scanned} new email${s.scanned === 1 ? "" : "s"}`];
  if (s.updated) parts.push(`${s.updated} updated`);
  if (s.created) parts.push(`${s.created} added`);
  if (s.oaAdded) parts.push(`${s.oaAdded} OA${s.oaAdded === 1 ? "" : "s"}`);
  if (s.unmatched) parts.push(`${s.unmatched} unmatched`);
  return parts.join(" · ");
}

function bannerFromParams(params: URLSearchParams): { kind: "ok" | "error"; text: string } | null {
  const result = params.get("gmail");
  if (!result) return null;
  if (result === "connected") return { kind: "ok", text: "Gmail connected. The first sync is running now." };
  return { kind: "error", text: params.get("reason") || "Couldn't connect Gmail." };
}

interface Props {
  cardCls: string;
  btnCls: string;
}

export default function GmailSyncCard({ cardCls, btnCls }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: status, isLoading } = useGmailStatus();
  const connected = !!status?.connected;
  const { data: events } = useGmailEvents(connected);
  const sync = useSyncGmail();
  const setEnabled = useSetGmailSyncEnabled();
  const disconnect = useDisconnectGmail();
  const [connecting, setConnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  // Google sends the browser back to /settings?gmail=connected|error; read it once on mount.
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(() =>
    bannerFromParams(new URLSearchParams(window.location.search))
  );

  // Then drop the params so a refresh doesn't repeat the message.
  useEffect(() => {
    if (!searchParams.has("gmail")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("gmail");
    next.delete("reason");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Skipped rows ("already tracked as Applied") are most of the log; show changes first.
  const skippedCount = events?.filter((e) => e.action === "IGNORED").length ?? 0;
  const visibleEvents = (events ?? []).filter((e) => showSkipped || e.action !== "IGNORED");

  async function handleConnect() {
    setConnecting(true);
    try {
      await connectGmail();
    } catch {
      setBanner({ kind: "error", text: "Gmail sync isn't available right now." });
      setConnecting(false);
    }
  }

  return (
    <div className={`mt-4 ${cardCls}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-text-primary">Gmail sync</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Reads confirmation, interview, assessment, offer and rejection emails and updates your applications.
            Read-only; nothing is sent or changed in your inbox.
          </p>
        </div>
        <Mail className="h-5 w-5 shrink-0 text-text-tertiary" />
      </div>

      {banner && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            banner.kind === "ok" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}
        >
          {banner.text}
        </p>
      )}

      {isLoading ? (
        <div className="mt-4 h-9 w-40 animate-pulse rounded-md bg-surface-tertiary" />
      ) : !status?.configured ? (
        <p className="mt-4 text-sm text-text-tertiary">Gmail sync isn't configured on this server.</p>
      ) : !connected ? (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {connecting ? "Opening Google…" : "Connect Gmail"}
        </button>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium text-text-primary">{status.email}</span>
            <span className="text-text-tertiary">
              {status.syncing
                ? status.lastSyncedAt
                  ? "Syncing…"
                  : "First sync in progress…"
                : status.lastSyncedAt
                  ? `Last synced ${formatDateTime(status.lastSyncedAt)}`
                  : "Not synced yet"}
            </span>
          </div>
          {status.lastError && <p className="mt-2 text-sm text-red-400">{status.lastError}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => sync.mutate()}
              disabled={sync.isPending || status.syncing}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-text-tertiary ${sync.isPending || status.syncing ? "animate-spin" : ""}`} />
              {sync.isPending || status.syncing ? "Syncing…" : "Sync now"}
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 px-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={status.syncEnabled ?? true}
                onChange={(e) => setEnabled.mutate(e.target.checked)}
                className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
              />
              Sync automatically every 6 hours
            </label>
            <div className="ml-auto">
              {confirmDisconnect ? (
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="text-text-tertiary">Disconnect?</span>
                  <button
                    onClick={() => disconnect.mutate(undefined, { onSettled: () => setConfirmDisconnect(false) })}
                    className="font-medium text-red-400 hover:text-red-300"
                  >
                    Yes
                  </button>
                  <button onClick={() => setConfirmDisconnect(false)} className="text-text-secondary hover:text-text-primary">
                    No
                  </button>
                </span>
              ) : (
                <button onClick={() => setConfirmDisconnect(true)} className={`${btnCls} text-text-secondary`}>
                  <Unplug className="h-4 w-4 text-text-tertiary" />
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {sync.isSuccess && (
            <>
              <p className="mt-3 text-sm text-text-secondary">{summarize(sync.data)}</p>
              {sync.data.note && <p className="mt-1 text-sm text-amber-400">{sync.data.note}</p>}
            </>
          )}
          {/* The server saves failures to lastError (shown above); only show a different message here */}
          {sync.isError &&
            (() => {
              const msg =
                (sync.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Sync failed.";
              return msg === status.lastError ? null : <p className="mt-3 text-sm text-red-400">{msg}</p>;
            })()}

          {events && events.length > 0 && (
            <div className="mt-5 border-t border-border-subtle pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Recent activity</p>
                {skippedCount > 0 && (
                  <button
                    onClick={() => setShowSkipped((v) => !v)}
                    className="text-xs text-text-tertiary transition-colors hover:text-text-secondary"
                  >
                    {showSkipped ? "Hide skipped" : `Show ${skippedCount} skipped`}
                  </button>
                )}
              </div>
              {visibleEvents.length === 0 && (
                <p className="py-2 text-sm text-text-tertiary">No changes yet; everything found was already up to date.</p>
              )}
              <ul className="divide-y divide-border-subtle">
                {visibleEvents.map((e) => {
                  const a = ACTION_LABEL[e.action];
                  const who = [e.company, e.title].filter(Boolean).join(" · ") || e.subject;
                  return (
                    <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${a.cls}`}>{a.label}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-text-primary" title={e.subject}>
                          {who}
                        </p>
                        <p className="truncate text-xs text-text-tertiary">
                          {CLASS_LABEL[e.classification] ?? e.classification}
                          {e.detail ? ` — ${e.detail}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-text-tertiary">{formatShortDate(e.receivedAt)}</span>
                      {e.applicationId && (
                        <Link
                          to={`/applications/${e.applicationId}`}
                          className="shrink-0 text-text-tertiary hover:text-text-primary"
                          title="Open application"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
