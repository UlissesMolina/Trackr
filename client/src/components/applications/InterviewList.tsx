import { useState, type FormEvent } from "react";
import {
  useInterviews,
  useCreateInterview,
  useDeleteInterview,
} from "../../hooks/useInterviews";
import {
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  type InterviewType,
} from "../../lib/constants";
import { formatDate } from "../../lib/utils";

interface InterviewListProps {
  applicationId: string;
}

const INPUT =
  "w-full rounded-lg border border-border-default bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InterviewList({ applicationId }: InterviewListProps) {
  const { data: interviews = [], isLoading } = useInterviews(applicationId);
  const createMutation = useCreateInterview();
  const deleteMutation = useDeleteInterview();

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<InterviewType>("PHONE_SCREEN");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setType("PHONE_SCREEN");
    setDate("");
    setTime("");
    setLocation("");
    setNotes("");
    setShowForm(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date || !time) return;

    createMutation.mutate(
      {
        applicationId,
        type,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        location: location || undefined,
        notes: notes || undefined,
      },
      { onSuccess: resetForm }
    );
  }

  const now = new Date();

  return (
    <div>
      {isLoading ? (
        <p className="text-sm text-text-tertiary">Loading interviews...</p>
      ) : interviews.length === 0 && !showForm ? (
        <p className="text-sm text-text-tertiary">No interviews scheduled.</p>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const scheduled = new Date(interview.scheduledAt);
            const isPast = scheduled < now;

            return (
              <div
                key={interview.id}
                className={`rounded-lg border px-4 py-3 ${
                  isPast
                    ? "border-border-default bg-surface-tertiary opacity-70"
                    : "border-accent/30 bg-accent/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
                        {INTERVIEW_TYPE_LABELS[interview.type as InterviewType]}
                      </span>
                      {isPast && (
                        <span className="text-xs text-text-tertiary">Completed</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-text-primary">
                      {formatDate(interview.scheduledAt)} at {formatTime(interview.scheduledAt)}
                    </p>
                    {interview.location && (
                      <p className="mt-0.5 text-xs text-text-tertiary">{interview.location}</p>
                    )}
                    {interview.notes && (
                      <p className="mt-1.5 whitespace-pre-wrap text-xs text-text-secondary">
                        {interview.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      deleteMutation.mutate({
                        applicationId,
                        interviewId: interview.id,
                      })
                    }
                    disabled={deleteMutation.isPending}
                    className="shrink-0 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-border-default bg-surface-tertiary p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as InterviewType)} className={INPUT}>
                {INTERVIEW_TYPES.map((t) => (
                  <option key={t} value={t}>{INTERVIEW_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Date *</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Time *</label>
              <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary">Location / Link</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Zoom link or office address" className={INPUT} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-text-secondary">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Interview prep notes..." rows={2} className={INPUT} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated">
              Cancel
            </button>
            <button type="submit" disabled={!date || !time || createMutation.isPending} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50">
              {createMutation.isPending ? "Adding..." : "Add Interview"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 flex items-center gap-1 text-sm text-accent hover:text-accent-hover"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Schedule Interview
        </button>
      )}
    </div>
  );
}
