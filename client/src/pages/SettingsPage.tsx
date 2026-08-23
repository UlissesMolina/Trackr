import { useState } from "react";
import { Trash2, Sun, Moon, Download, RefreshCw, User, LogOut, Github, AlertTriangle } from "lucide-react";
import Modal from "../components/ui/Modal";
import { useClerk } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../hooks/useTheme";
import api from "../lib/api";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { openUserProfile, signOut } = useClerk();
  const qc = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearCount, setClearCount] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  async function handleExportCsv() {
    setExporting(true);
    try {
      const { data } = await api.get("/applications");
      const apps = data as Record<string, unknown>[];
      if (apps.length === 0) return;
      const cols = [
        { key: "title", label: "Title" },
        { key: "company", label: "Company" },
        { key: "location", label: "Location" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
        { key: "dateApplied", label: "Date Applied" },
        { key: "url", label: "URL" },
        { key: "salaryMin", label: "Salary Min" },
        { key: "salaryMax", label: "Salary Max" },
      ];
      const header = cols.map((c) => c.label).join(",");
      const rows = apps.map((a) =>
        cols.map(({ key }) => {
          let v = a[key] ?? "";
          if (key === "dateApplied" && v) v = String(v).slice(0, 10);
          return `"${String(v).replace(/"/g, '""')}"`;
        }).join(",")
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "trackr-applications.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleOpenClearModal() {
    try {
      const { data } = await api.get("/dashboard/stats");
      setClearCount(data.totalApplications ?? 0);
    } catch {
      setClearCount(0);
    }
    setShowClearModal(true);
  }

  async function handleClearAll() {
    setClearing(true);
    try {
      await api.delete("/applications/clear-all");
      qc.invalidateQueries();
      setShowClearModal(false);
      setClearCount(null);
    } finally {
      setClearing(false);
    }
  }

  const cardCls = "rounded-xl border border-border-default bg-surface-secondary p-6";
  const btnCls = "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-text-primary transition-colors hover:bg-surface-elevated";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Appearance, account, and data.
      </p>

      {/* Appearance */}
      <div className={`mt-8 ${cardCls}`}>
        <h2 className="text-base font-medium text-text-primary">Appearance</h2>
        <div className="mt-4">
          <button onClick={toggleTheme} className={btnCls}>
            {theme === "dark" ? <Sun className="h-4 w-4 text-text-tertiary" /> : <Moon className="h-4 w-4 text-text-tertiary" />}
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </button>
        </div>
      </div>

      {/* Account */}
      <div className={`mt-4 ${cardCls}`}>
        <h2 className="text-base font-medium text-text-primary">Account</h2>
        <div className="mt-4 flex flex-col gap-1">
          <button onClick={() => openUserProfile()} className={btnCls}>
            <User className="h-4 w-4 text-text-tertiary" />
            Manage account
          </button>
          <button onClick={() => signOut({ redirectUrl: "/" })} className={btnCls}>
            <LogOut className="h-4 w-4 text-text-tertiary" />
            Sign out
          </button>
        </div>
      </div>

      {/* Data */}
      <div className={`mt-4 ${cardCls}`}>
        <h2 className="text-base font-medium text-text-primary">Data</h2>
        <div className="mt-4 flex flex-col gap-1">
          <button onClick={handleExportCsv} disabled={exporting} className={`${btnCls} disabled:opacity-50`}>
            <Download className="h-4 w-4 text-text-tertiary" />
            {exporting ? "Exporting..." : "Export as CSV"}
          </button>
          <button onClick={() => qc.invalidateQueries()} className={btnCls}>
            <RefreshCw className="h-4 w-4 text-text-tertiary" />
            Refresh data
          </button>
          <div className="mt-3 border-t border-border-subtle pt-3">
            <button
              onClick={handleOpenClearModal}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Clear all applications
            </button>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      <Modal open={showClearModal} onClose={() => !clearing && setShowClearModal(false)} title="Clear all applications">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Are you sure?</p>
            <p className="text-sm leading-relaxed text-text-secondary">
              This will permanently delete{" "}
              <span className="font-semibold text-text-primary">
                {clearCount} {clearCount === 1 ? "application" : "applications"}
              </span>{" "}
              and all related notes, interviews, and status history. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowClearModal(false)}
            disabled={clearing}
            className="h-9 rounded-md border border-border-default px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleClearAll}
            disabled={clearing || clearCount === 0}
            className="h-9 rounded-md bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {clearing ? "Deleting..." : "Delete all"}
          </button>
        </div>
      </Modal>

      {/* Links */}
      <div className={`mt-4 mb-8 ${cardCls}`}>
        <h2 className="text-base font-medium text-text-primary">Links</h2>
        <div className="mt-4">
          <a
            href="https://github.com/UlissesMolina/Trackr"
            target="_blank"
            rel="noopener noreferrer"
            className={btnCls}
          >
            <Github className="h-4 w-4 text-text-tertiary" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
