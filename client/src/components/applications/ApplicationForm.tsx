import { useState, type FormEvent } from "react";
import {
  BOARD_STATUSES,
  STATUS_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
  type BoardStatus,
  type ApplicationPriority,
} from "../../lib/constants";

export interface ApplicationFormData {
  title: string;
  company: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  url: string;
  status: BoardStatus;
  priority: ApplicationPriority | "";
  dateApplied: string;
  followUpDate: string;
}

interface ApplicationFormProps {
  initial?: Partial<ApplicationFormData>;
  onSubmit: (data: ApplicationFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const EMPTY: ApplicationFormData = {
  title: "",
  company: "",
  location: "",
  salaryMin: "",
  salaryMax: "",
  url: "",
  status: "SAVED",
  priority: "",
  dateApplied: "",
  followUpDate: "",
};

const INPUT =
  "w-full rounded-lg border border-border-default bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export default function ApplicationForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationFormData>({ ...EMPTY, ...initial });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  function update(field: keyof ApplicationFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Job Title *</label>
          <input required type="text" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Software Engineer" className={INPUT} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Company *</label>
          <input required type="text" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Acme Inc." className={INPUT} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Location</label>
          <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="San Francisco, CA" className={INPUT} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Status</label>
          <select value={form.status} onChange={(e) => update("status", e.target.value)} className={INPUT}>
            {BOARD_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Priority</label>
          <select value={form.priority} onChange={(e) => update("priority", e.target.value)} className={INPUT}>
            <option value="">None</option>
            {PRIORITY_LEVELS.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Min Salary</label>
          <input type="number" value={form.salaryMin} onChange={(e) => update("salaryMin", e.target.value)} placeholder="80000" className={INPUT} />
        </div>
        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Max Salary</label>
          <input type="number" value={form.salaryMax} onChange={(e) => update("salaryMax", e.target.value)} placeholder="120000" className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Job URL</label>
          <input type="url" value={form.url} onChange={(e) => update("url", e.target.value)} placeholder="https://company.com/jobs/123" className={INPUT} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Date Applied</label>
          <input type="date" value={form.dateApplied} onChange={(e) => update("dateApplied", e.target.value)} className={INPUT} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-text-secondary">Follow Up By</label>
          <input type="date" value={form.followUpDate} onChange={(e) => update("followUpDate", e.target.value)} className={INPUT} />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-border-default pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50">
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
