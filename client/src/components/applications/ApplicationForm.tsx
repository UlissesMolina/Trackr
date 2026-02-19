import { useState, type FormEvent } from "react";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "../../lib/constants";

export interface ApplicationFormData {
  title: string;
  company: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  url: string;
  status: ApplicationStatus;
  dateApplied: string;
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
  dateApplied: "",
};

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
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Job Title *
          </label>
          <input
            required
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Software Engineer"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Company *
          </label>
          <input
            required
            type="text"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Acme Inc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="San Francisco, CA"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Min Salary
          </label>
          <input
            type="number"
            value={form.salaryMin}
            onChange={(e) => update("salaryMin", e.target.value)}
            placeholder="80000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Max Salary
          </label>
          <input
            type="number"
            value={form.salaryMax}
            onChange={(e) => update("salaryMax", e.target.value)}
            placeholder="120000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Job URL
          </label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
            placeholder="https://company.com/jobs/123"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Date Applied
          </label>
          <input
            type="date"
            value={form.dateApplied}
            onChange={(e) => update("dateApplied", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
