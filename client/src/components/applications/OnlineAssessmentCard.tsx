import { useState, type FormEvent } from "react";
import { useOA, useUpsertOA, useDeleteOA } from "../../hooks/useOA";
import { formatDate } from "../../lib/utils";

interface OnlineAssessmentCardProps {
  applicationId: string;
}

const INPUT =
  "w-full rounded-lg border border-border-default bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-150 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400";

const PLATFORM_PRESETS = ["HackerRank", "CodeSignal", "LeetCode", "Take-home", "CoderPad", "Karat"];

function dueDateUrgency(dueDate: string | null): { label: string; color: string } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Overdue", color: "text-red-400 bg-red-500/10 border-red-500/30" };
  if (days === 0) return { label: "Due today", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
  if (days === 1) return { label: "Due tomorrow", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
  if (days <= 3) return { label: `Due in ${days} days`, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" };
  return { label: `Due in ${days} days`, color: "text-text-secondary bg-surface-tertiary border-border-default" };
}

export default function OnlineAssessmentCard({ applicationId }: OnlineAssessmentCardProps) {
  const { data: oa, isLoading } = useOA(applicationId);
  const upsertMutation = useUpsertOA();
  const deleteMutation = useDeleteOA();

  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");

  function openEditForm() {
    if (oa) {
      setPlatform(oa.platform ?? "");
      setDueDate(oa.dueDate ? oa.dueDate.slice(0, 10) : "");
      setLink(oa.link ?? "");
      setNotes(oa.notes ?? "");
    } else {
      setPlatform("");
      setDueDate("");
      setLink("");
      setNotes("");
    }
    setShowForm(true);
  }

  function resetForm() {
    setPlatform("");
    setDueDate("");
    setLink("");
    setNotes("");
    setShowForm(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    upsertMutation.mutate(
      {
        applicationId,
        platform: platform || null,
        dueDate: dueDate || null,
        link: link || null,
        notes: notes || null,
      },
      { onSuccess: () => setShowForm(false) }
    );
  }

  function handleMarkComplete() {
    if (!oa) return;
    upsertMutation.mutate({
      applicationId,
      platform: oa.platform,
      dueDate: oa.dueDate,
      link: oa.link,
      notes: oa.notes,
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    });
  }

  function handleMarkPending() {
    if (!oa) return;
    upsertMutation.mutate({
      applicationId,
      platform: oa.platform,
      dueDate: oa.dueDate,
      link: oa.link,
      notes: oa.notes,
      status: "PENDING",
      completedAt: null,
    });
  }

  function handleDelete() {
    deleteMutation.mutate(applicationId, { onSuccess: resetForm });
  }

  if (isLoading) {
    return <p className="text-sm text-text-tertiary">Loading...</p>;
  }

  // Form mode
  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Platform</label>
          <input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. HackerRank, CodeSignal"
            className={INPUT}
            list="oa-platforms"
          />
          <datalist id="oa-platforms">
            {PLATFORM_PRESETS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Link</label>
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className={INPUT} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions, topics to review..." rows={2} className={INPUT} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={resetForm} className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated">
            Cancel
          </button>
          <button type="submit" disabled={upsertMutation.isPending} className="rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-600 disabled:opacity-50">
            {upsertMutation.isPending ? "Saving..." : oa ? "Update" : "Add OA"}
          </button>
        </div>
      </form>
    );
  }

  // Empty state
  if (!oa) {
    return (
      <div>
        <p className="text-sm text-text-tertiary">No online assessment.</p>
        <button
          onClick={openEditForm}
          className="mt-3 flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add OA
        </button>
      </div>
    );
  }

  // Display state
  const urgency = oa.status === "PENDING" ? dueDateUrgency(oa.dueDate) : null;
  const isCompleted = oa.status === "COMPLETED";

  return (
    <div>
      <div className={`rounded-lg border px-4 py-3 ${isCompleted ? "border-border-default bg-surface-tertiary" : "border-purple-500/30 bg-purple-500/5"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {oa.platform && (
                <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                  {oa.platform}
                </span>
              )}
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${isCompleted ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                {isCompleted ? "Completed" : "Pending"}
              </span>
            </div>

            {urgency && (
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${urgency.color}`}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {urgency.label}
              </div>
            )}

            {oa.dueDate && (
              <p className="mt-1.5 text-sm text-text-primary">
                Due: {formatDate(oa.dueDate)}
              </p>
            )}

            {isCompleted && oa.completedAt && (
              <p className="mt-0.5 text-xs text-text-tertiary">
                Completed {formatDate(oa.completedAt)}
              </p>
            )}

            {oa.link && (
              <a
                href={oa.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Open Assessment
              </a>
            )}

            {oa.notes && (
              <p className="mt-1.5 whitespace-pre-wrap text-xs text-text-secondary">{oa.notes}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isCompleted ? (
              <button
                onClick={handleMarkComplete}
                disabled={upsertMutation.isPending}
                className="rounded-md bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/30 disabled:opacity-50"
              >
                Mark Complete
              </button>
            ) : (
              <button
                onClick={handleMarkPending}
                disabled={upsertMutation.isPending}
                className="rounded-md bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button onClick={openEditForm} className="text-xs text-text-tertiary hover:text-text-secondary">
          Edit
        </button>
        <button onClick={handleDelete} disabled={deleteMutation.isPending} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50">
          {deleteMutation.isPending ? "Removing..." : "Remove"}
        </button>
      </div>
    </div>
  );
}
