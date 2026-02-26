import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useApplication,
  useUpdateApplication,
  useDeleteApplication,
} from "../hooks/useApplications";
import StatusBadge from "../components/applications/StatusBadge";
import StatusSelect from "../components/applications/StatusSelect";
import { boardStatus } from "../lib/constants";
import StatusTimeline from "../components/applications/StatusTimeline";
import NotesList from "../components/applications/NotesList";
import InterviewList from "../components/applications/InterviewList";
import TagSelect from "../components/applications/TagSelect";
import PrioritySelect from "../components/applications/PrioritySelect";
import ApplicationForm, {
  type ApplicationFormData,
} from "../components/applications/ApplicationForm";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { formatDate, formatSalary } from "../lib/utils";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: app, isLoading } = useApplication(id!);
  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleUpdate(form: ApplicationFormData) {
    updateMutation.mutate(
      {
        id: id!,
        title: form.title,
        company: form.company,
        location: form.location || null,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        url: form.url || null,
        priority: form.priority || null,
        dateApplied: form.dateApplied || null,
        followUpDate: form.followUpDate || null,
      },
      { onSuccess: () => setShowEdit(false) }
    );
  }

  function handleDelete() {
    setShowDeleteConfirm(true);
  }

  function confirmDelete() {
    deleteMutation.mutate(id!, {
      onSuccess: () => navigate("/board"),
      onSettled: () => setShowDeleteConfirm(false),
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-text-secondary">Application not found.</p>
        <Link to="/board" className="text-sm text-accent hover:underline">Back to Board</Link>
      </div>
    );
  }

  const editInitial: Partial<ApplicationFormData> = {
    title: app.title,
    company: app.company,
    location: app.location ?? "",
    salaryMin: app.salaryMin?.toString() ?? "",
    salaryMax: app.salaryMax?.toString() ?? "",
    url: app.url ?? "",
    status: boardStatus(app.status),
    priority: app.priority ?? "",
    dateApplied: app.dateApplied ? app.dateApplied.slice(0, 10) : "",
    followUpDate: app.followUpDate ? app.followUpDate.slice(0, 10) : "",
  };

  const followUpStatus = (() => {
    if (!app.followUpDate) return null;
    const followUp = new Date(app.followUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    followUp.setHours(0, 0, 0, 0);
    const diff = followUp.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Overdue", color: "text-red-400 bg-red-500/10 border-red-500/30" };
    if (days === 0) return { label: "Today", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    if (days === 1) return { label: "Tomorrow", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    return { label: `In ${days} days`, color: "text-text-secondary bg-surface-tertiary border-border-default" };
  })();

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/board"
          className="mb-3 inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Board
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">{app.title}</h1>
            <p className="mt-1 text-lg text-text-secondary">{app.company}</p>
            <div className="mt-2">
              <TagSelect applicationId={app.id} currentTags={app.tags ?? []} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PrioritySelect applicationId={app.id} currentPriority={app.priority ?? null} />
            <StatusSelect applicationId={app.id} currentStatus={app.status} />
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-lg border border-border-default px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {followUpStatus && (
        <div className={`mb-6 flex items-center gap-3 rounded-xl border px-5 py-3 ${followUpStatus.color}`}>
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">
            Follow up {followUpStatus.label.toLowerCase() === "overdue" ? "was due" : "due"}: {formatDate(app.followUpDate!)} ({followUpStatus.label})
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">Details</h2>
            <dl className="grid grid-cols-2 gap-4">
              {app.location && (
                <div>
                  <dt className="text-xs font-medium text-text-tertiary">Location</dt>
                  <dd className="mt-1 text-sm text-text-primary">{app.location}</dd>
                </div>
              )}
              {(app.salaryMin || app.salaryMax) && (
                <div>
                  <dt className="text-xs font-medium text-text-tertiary">Salary Range</dt>
                  <dd className="mt-1 text-sm text-text-primary">
                    {app.salaryMin && app.salaryMax
                      ? `${formatSalary(app.salaryMin)} – ${formatSalary(app.salaryMax)}`
                      : app.salaryMin
                        ? `From ${formatSalary(app.salaryMin)}`
                        : `Up to ${formatSalary(app.salaryMax!)}`}
                  </dd>
                </div>
              )}
              {app.dateApplied && (
                <div>
                  <dt className="text-xs font-medium text-text-tertiary">Date Applied</dt>
                  <dd className="mt-1 text-sm text-text-primary">{formatDate(app.dateApplied)}</dd>
                </div>
              )}
              {app.url && (
                <div>
                  <dt className="text-xs font-medium text-text-tertiary">Job Posting</dt>
                  <dd className="mt-1 text-sm">
                    <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">View Posting</a>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">Interviews</h2>
            <InterviewList applicationId={app.id} />
          </div>

          <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">Cover Letter</h2>
            {app.coverLetter ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{app.coverLetter}</p>
            ) : (
              <Link
                to={`/cover-letter?applicationId=${app.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generate with AI
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">Notes</h2>
            <NotesList applicationId={app.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">Status</h2>
            <StatusBadge status={app.status} />
          </div>

          <div className="rounded-xl border border-border-default bg-surface-secondary p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">Timeline</h2>
            <StatusTimeline statusChanges={app.statusChanges ?? []} />
          </div>
        </div>
      </div>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Application">
        <ApplicationForm
          initial={editInitial}
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          loading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete application?"
        message="Are you sure you want to delete this application? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
