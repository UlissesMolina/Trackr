import { useState } from "react";
import { useUpdateApplication, useUpdateApplicationStatus } from "../../hooks/useApplications";
import { useFollowUpEmail } from "../../hooks/useAI";
import { getApiError } from "../../lib/utils";
import FollowUpEmailModal from "../ai/FollowUpEmailModal";
import type { Application } from "../../types";

const SNOOZE_DAYS = 7;

interface StaleActionsProps {
  application: Application;
  size?: "sm" | "md";
}

export default function StaleActions({ application, size = "md" }: StaleActionsProps) {
  const statusMutation = useUpdateApplicationStatus();
  const updateMutation = useUpdateApplication();
  const followUp = useFollowUpEmail();
  const [showEmail, setShowEmail] = useState(false);

  function handleDraft() {
    setShowEmail(true);
    followUp.mutate(application.id);
  }

  function handleSnooze() {
    const until = new Date();
    until.setDate(until.getDate() + SNOOZE_DAYS);
    // Send a calendar day, the same format the application form uses.
    const day = `${until.getFullYear()}-${String(until.getMonth() + 1).padStart(2, "0")}-${String(until.getDate()).padStart(2, "0")}`;
    updateMutation.mutate({ id: application.id, followUpDate: day });
  }

  function handleReject() {
    statusMutation.mutate({ id: application.id, status: "REJECTED" });
  }

  const btn =
    size === "sm"
      ? "rounded-md px-2 py-1 text-xs font-medium"
      : "rounded-lg px-3 py-1.5 text-sm font-medium";
  const neutral = `${btn} border border-border-default text-text-secondary hover:bg-surface-elevated disabled:opacity-50`;
  const actionError =
    (updateMutation.isError && getApiError(updateMutation.error, "Couldn't snooze. Try again.")) ||
    (statusMutation.isError && getApiError(statusMutation.error, "Couldn't update the status. Try again.")) ||
    null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleDraft}
          disabled={followUp.isPending}
          className={`${btn} bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-50`}
        >
          Draft follow-up
        </button>
        <button onClick={handleSnooze} disabled={updateMutation.isPending} className={neutral}>
          {updateMutation.isPending ? "Snoozing…" : `Snooze ${SNOOZE_DAYS}d`}
        </button>
        <button
          onClick={handleReject}
          disabled={statusMutation.isPending}
          className={`${btn} border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50`}
        >
          {statusMutation.isPending ? "Rejecting…" : "Mark rejected"}
        </button>
      </div>
      {actionError && <p className="mt-1.5 text-xs text-red-400">{actionError}</p>}
      <FollowUpEmailModal
        open={showEmail}
        onClose={() => setShowEmail(false)}
        company={application.company}
        email={followUp.data}
        loading={followUp.isPending}
        error={followUp.isError ? getApiError(followUp.error, "Couldn't draft an email. Try again.") : null}
        onRegenerate={() => followUp.mutate(application.id)}
      />
    </>
  );
}
