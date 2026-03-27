import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import Modal from "../ui/Modal";
import {
  STATUS_LABELS,
  type ApplicationStatus,
  type ApplicationPriority,
} from "../../lib/constants";

interface ExtractedApp {
  title: string;
  company: string;
  location?: string;
  url?: string;
  dateApplied?: string;
  status?: ApplicationStatus;
  priority?: ApplicationPriority | null;
}

interface EmailImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function EmailImportModal({ open, onClose }: EmailImportModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"paste" | "preview">("paste");
  const [emailText, setEmailText] = useState("");
  const [applications, setApplications] = useState<ExtractedApp[]>([]);

  const extractMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post<{ applications: ExtractedApp[] }>("/ai/extract-from-email", {
        emailText: text,
      });
      return data.applications;
    },
    onSuccess: (apps) => {
      setApplications(apps);
      setStep("preview");
    },
  });

  const importMutation = useMutation({
    mutationFn: async (apps: ExtractedApp[]) => {
      const { data } = await api.post<{ imported: number }>("/applications/import", {
        applications: apps,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      reset();
      onClose();
    },
  });

  function reset() {
    setStep("paste");
    setEmailText("");
    setApplications([]);
    extractMutation.reset();
    importMutation.reset();
  }

  function removeApp(index: number) {
    setApplications((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import from Email"
    >
      {step === "paste" && (
        <div>
          <p className="mb-3 text-sm text-text-secondary">
            Paste one or more "thank you for applying" confirmation emails below. AI will extract the
            job details automatically.
          </p>

          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder={'Paste your email text here...\n\nExample:\n"Thank you for applying to Software Engineer at Acme Corp..."'}
            rows={8}
            className="w-full rounded-lg border border-border-default bg-surface-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />

          <div className="mt-3 rounded-lg border border-border-default bg-surface-tertiary p-3">
            <p className="text-xs text-text-tertiary">
              Tip: You can paste multiple emails at once — just separate them with a blank line. The AI
              will extract each application separately.
            </p>
          </div>

          {extractMutation.isError && (
            <p className="mt-3 text-sm text-red-400">
              Failed to extract applications. Please check your text and try again.
            </p>
          )}

          <div className="mt-5 flex justify-end border-t border-border-default pt-4">
            <button
              onClick={() => extractMutation.mutate(emailText)}
              disabled={emailText.trim().length < 10 || extractMutation.isPending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {extractMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Extracting...
                </span>
              ) : (
                "Extract Applications"
              )}
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          {applications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-secondary">No applications could be extracted from the email text.</p>
              <button
                onClick={() => setStep("paste")}
                className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
              >
                Try again with different text
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-text-secondary">
                Found <span className="font-semibold text-text-primary">{applications.length}</span>{" "}
                application{applications.length !== 1 ? "s" : ""}. Review and edit before importing:
              </p>

              <div className="max-h-72 space-y-3 overflow-y-auto">
                {applications.map((app, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border-default bg-surface-tertiary p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary">{app.title}</p>
                        <p className="text-sm text-text-secondary">{app.company}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
                          {app.location && <span>{app.location}</span>}
                          {app.dateApplied && <span>{app.dateApplied}</span>}
                          {app.status && <span>{STATUS_LABELS[app.status] ?? app.status}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeApp(i)}
                        className="shrink-0 rounded p-1 text-text-tertiary hover:bg-surface-elevated hover:text-red-400"
                        title="Remove"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {importMutation.isError && (
                <p className="mt-3 text-sm text-red-400">Import failed. Please try again.</p>
              )}

              <div className="mt-5 flex justify-end gap-3 border-t border-border-default pt-4">
                <button
                  onClick={() => setStep("paste")}
                  className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
                >
                  Back
                </button>
                <button
                  onClick={() => importMutation.mutate(applications)}
                  disabled={importMutation.isPending || applications.length === 0}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {importMutation.isPending
                    ? "Importing..."
                    : `Import ${applications.length} Application${applications.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
