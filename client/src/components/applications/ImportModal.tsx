import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import Modal from "../ui/Modal";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "../../lib/constants";

type RawRow = Record<string, string>;

interface MappedRow {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  url?: string;
  status?: ApplicationStatus;
  dateApplied?: string;
}

const FIELDS = [
  { key: "title", label: "Job Title", required: true },
  { key: "company", label: "Company", required: true },
  { key: "location", label: "Location", required: false },
  { key: "salaryMin", label: "Min Salary", required: false },
  { key: "salaryMax", label: "Max Salary", required: false },
  { key: "url", label: "URL", required: false },
  { key: "status", label: "Status", required: false },
  { key: "dateApplied", label: "Date Applied", required: false },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function guessMapping(headers: string[]): Record<FieldKey, string> {
  const mapping: Record<string, string> = {};
  const lower = headers.map((h) => h.toLowerCase().trim());

  const patterns: [FieldKey, RegExp][] = [
    ["title", /^(job.?title|title|position|role)$/i],
    ["company", /^(company|employer|organization|org)$/i],
    ["location", /^(location|city|place)$/i],
    ["salaryMin", /^(salary.?min|min.?salary|salary.?low)$/i],
    ["salaryMax", /^(salary.?max|max.?salary|salary.?high)$/i],
    ["url", /^(url|link|job.?url|job.?link|posting)$/i],
    ["status", /^(status|stage|state)$/i],
    ["dateApplied", /^(date.?applied|applied.?date|date|applied)$/i],
  ];

  for (const [field, regex] of patterns) {
    const idx = lower.findIndex((h) => regex.test(h));
    if (idx !== -1) mapping[field] = headers[idx];
  }

  return mapping as Record<FieldKey, string>;
}

function normalizeStatus(raw: string | undefined): ApplicationStatus | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_");
  if (APPLICATION_STATUSES.includes(upper as ApplicationStatus)) return upper as ApplicationStatus;
  const labelMap: Record<string, ApplicationStatus> = {};
  for (const s of APPLICATION_STATUSES) labelMap[STATUS_LABELS[s].toUpperCase()] = s;
  return labelMap[raw.toUpperCase().trim()] ?? undefined;
}

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [dragOver, setDragOver] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (applications: MappedRow[]) => {
      const { data } = await api.post<{ imported: number }>("/applications/import", { applications });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      reset();
      onClose();
    },
  });

  function reset() {
    setStep("upload");
    setRawRows([]);
    setHeaders([]);
    setMapping({} as Record<FieldKey, string>);
    setDragOver(false);
    importMutation.reset();
  }

  const handleFile = useCallback((file: File) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.data.length === 0) return;
        const hdrs = result.meta.fields ?? [];
        setHeaders(hdrs);
        setRawRows(result.data);
        setMapping(guessMapping(hdrs));
        setStep("map");
      },
    });
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function getMapped(): MappedRow[] {
    return rawRows
      .map((row) => {
        const title = row[mapping.title]?.trim();
        const company = row[mapping.company]?.trim();
        if (!title || !company) return null;
        return {
          title,
          company,
          location: row[mapping.location]?.trim() || undefined,
          salaryMin: mapping.salaryMin && row[mapping.salaryMin] ? Number(row[mapping.salaryMin]) || undefined : undefined,
          salaryMax: mapping.salaryMax && row[mapping.salaryMax] ? Number(row[mapping.salaryMax]) || undefined : undefined,
          url: row[mapping.url]?.trim() || undefined,
          status: normalizeStatus(row[mapping.status]),
          dateApplied: row[mapping.dateApplied]?.trim() || undefined,
        } as MappedRow;
      })
      .filter(Boolean) as MappedRow[];
  }

  const mappedRows = step === "preview" ? getMapped() : [];
  const canProceed = mapping.title && mapping.company;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Import Applications"
    >
      {step === "upload" && (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
              dragOver ? "border-accent bg-accent/5" : "border-border-default hover:border-text-tertiary"
            }`}
          >
            <svg className="mb-3 h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-medium text-text-primary">Drop a CSV file here or click to browse</p>
            <p className="mt-1 text-xs text-text-tertiary">Supports .csv files</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleInputChange} className="hidden" />

          <div className="mt-4 rounded-lg border border-border-default bg-surface-tertiary p-4">
            <p className="text-xs font-medium text-text-secondary">Expected columns</p>
            <p className="mt-1 text-xs text-text-tertiary">
              title, company, location, salaryMin, salaryMax, url, status, dateApplied
            </p>
            <p className="mt-2 text-xs text-text-tertiary">
              Only <span className="text-text-secondary">title</span> and <span className="text-text-secondary">company</span> are required. Column names are auto-matched.
            </p>
          </div>
        </div>
      )}

      {step === "map" && (
        <div>
          <p className="mb-4 text-sm text-text-secondary">
            Found <span className="font-semibold text-text-primary">{rawRows.length}</span> rows. Map your CSV columns to Trackr fields:
          </p>

          <div className="space-y-3">
            {FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <label className="w-28 shrink-0 text-sm text-text-secondary">
                  {field.label}
                  {field.required && <span className="text-red-400"> *</span>}
                </label>
                <select
                  value={mapping[field.key] ?? ""}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="flex-1 rounded-lg border border-border-default bg-surface-tertiary px-3 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">— skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-border-default pt-4">
            <button onClick={() => { reset(); }} className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated">
              Back
            </button>
            <button
              onClick={() => setStep("preview")}
              disabled={!canProceed}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              Preview
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          <p className="mb-4 text-sm text-text-secondary">
            Ready to import <span className="font-semibold text-text-primary">{mappedRows.length}</span> applications
            {rawRows.length !== mappedRows.length && (
              <span className="text-text-tertiary"> ({rawRows.length - mappedRows.length} skipped — missing title or company)</span>
            )}
          </p>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-border-default">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-tertiary text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {mappedRows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="text-text-primary">
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2">{row.company}</td>
                    <td className="px-3 py-2 text-text-secondary">{row.status ? STATUS_LABELS[row.status] : "Saved"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mappedRows.length > 50 && (
              <p className="px-3 py-2 text-xs text-text-tertiary">...and {mappedRows.length - 50} more</p>
            )}
          </div>

          {importMutation.isError && (
            <p className="mt-3 text-sm text-red-400">Import failed. Please try again.</p>
          )}

          <div className="mt-5 flex justify-end gap-3 border-t border-border-default pt-4">
            <button onClick={() => setStep("map")} className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated">
              Back
            </button>
            <button
              onClick={() => importMutation.mutate(getMapped())}
              disabled={importMutation.isPending || mappedRows.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {importMutation.isPending ? "Importing..." : `Import ${mappedRows.length} Applications`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
