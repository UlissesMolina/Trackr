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
    updateMutation.mutate({ id: application.id, followUpDate: until.toISOString() });
  }

  function handleReject() {
    statusMutation.mutate({ id: application.id, status: "REJECTED" });
  }

  const btn =
    size === "sm"
      ? "rounded-md px-2 py-1 text-xs font-medium"
      : "rounded-lg px-3 py-1.5 text-sm font-medium";
  const neutral = `${btn} border border-border-default text-text-secondary hover:bg-surface-elevated disabled:opacity-50`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={handleDraft} className={`${btn} bg-accent/15 text-accent hover:bg-accent/25`}>
          Draft follow-up
        </button>
        <button onClick={handleSnooze} disabled={updateMutation.isPending} className={neutral}>
          Snooze {SNOOZE_DAYS}d
        </button>
        <button
          onClick={handleReject}
          disabled={statusMutation.isPending}
          className={`${btn} border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50`}
        >
          Mark rejected
        </button>
      </div>
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
