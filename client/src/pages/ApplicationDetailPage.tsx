import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useApplication,
  useUpdateApplication,
  useDeleteApplication,
} from "../hooks/useApplications";
import StatusBadge from "../components/applications/StatusBadge";
import StatusSelect from "../components/applications/StatusSelect";
import StatusTimeline from "../components/applications/StatusTimeline";
import NotesList from "../components/applications/NotesList";
import ApplicationForm, {
  type ApplicationFormData,
} from "../components/applications/ApplicationForm";
import Modal from "../components/ui/Modal";
import { formatDate, formatSalary } from "../lib/utils";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: app, isLoading } = useApplication(id!);
  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();
  const [showEdit, setShowEdit] = useState(false);

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
        dateApplied: form.dateApplied || null,
      },
      { onSuccess: () => setShowEdit(false) }
    );
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this application?")) return;
    deleteMutation.mutate(id!, { onSuccess: () => navigate("/board") });
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
    status: app.status,
    dateApplied: app.dateApplied ? app.dateApplied.slice(0, 10) : "",
  };

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

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{app.title}</h1>
            <p className="mt-1 text-lg text-text-secondary">{app.company}</p>
          </div>
          <div className="flex items-center gap-2">
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
              Delete
            </button>
          </div>
        </div>
      </div>

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
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">Cover Letter</h2>
            {app.coverLetter ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{app.coverLetter}</p>
            ) : (
              <p className="text-sm text-text-tertiary">No cover letter yet. Use the AI Cover Letter Generator to create one.</p>
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
    </div>
  );
}
