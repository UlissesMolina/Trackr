import { useState } from "react";
import {
  useApplications,
  useCreateApplication,
  useUpdateApplicationStatus,
} from "../hooks/useApplications";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_DOT_COLORS,
  type ApplicationStatus,
} from "../lib/constants";
import ApplicationCard from "../components/applications/ApplicationCard";
import ApplicationForm, {
  type ApplicationFormData,
} from "../components/applications/ApplicationForm";
import Modal from "../components/ui/Modal";
import ImportModal from "../components/applications/ImportModal";

export default function BoardPage() {
  const { data: applications = [], isLoading } = useApplications();
  const createMutation = useCreateApplication();
  const statusMutation = useUpdateApplicationStatus();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function handleCreate(form: ApplicationFormData) {
    createMutation.mutate(
      {
        title: form.title,
        company: form.company,
        location: form.location || undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        url: form.url || undefined,
        status: form.status,
        dateApplied: form.dateApplied || undefined,
      },
      { onSuccess: () => setShowForm(false) }
    );
  }

  function handleDrop(status: ApplicationStatus) {
    if (!draggedId) return;
    const app = applications.find((a) => a.id === draggedId);
    if (app && app.status !== status) {
      statusMutation.mutate({ id: draggedId, status });
    }
    setDraggedId(null);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-secondary">Loading applications...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Application Board</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            + Add Application
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {APPLICATION_STATUSES.map((status) => {
          const cards = applications.filter((a) => a.status === status);

          return (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
              className="flex w-72 min-w-[18rem] flex-shrink-0 flex-col rounded-xl bg-surface-secondary p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT_COLORS[status]}`} />
                  <h2 className="text-sm font-semibold text-text-secondary">
                    {STATUS_LABELS[status]}
                  </h2>
                </div>
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs font-medium text-text-tertiary">
                  {cards.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {cards.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={() => setDraggedId(app.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <ApplicationCard application={app} />
                  </div>
                ))}

                {cards.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-border-default p-6">
                    <p className="text-center text-xs text-text-tertiary">
                      Drag cards here or add a new application
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Application">
        <ApplicationForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
