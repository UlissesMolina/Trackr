import { useState, useEffect } from "react";
import { Key, Trash2, Copy, Check, Plus, Sun, Moon, Download, RefreshCw, User, LogOut, Github } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../hooks/useTheme";
import api from "../lib/api";

interface ApiKeyEntry {
  id: string;
  label: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { openUserProfile, signOut } = useClerk();
  const qc = useQueryClient();
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function fetchKeys() {
    try {
      const { data } = await api.get("/api-keys");
      setKeys(data);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchKeys(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/api-keys", { label: label.trim() });
      setNewRawKey(data.rawKey);
      setLabel("");
      fetchKeys();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/api-keys/${id}`);
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function handleCopy() {
    if (!newRawKey) return;
    navigator.clipboard.writeText(newRawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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

  const cardCls = "rounded-lg border border-border-default bg-surface-secondary p-5";
  const btnCls = "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-text-primary transition-colors hover:bg-surface-elevated";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Appearance, account, data, and API keys.
      </p>

      {/* Appearance */}
      <div className={`mt-8 ${cardCls}`}>
        <h2 className="text-base font-medium text-text-primary">Appearance</h2>
        <div className="mt-3">
          <button onClick={toggleTheme} className={btnCls}>
            {theme === "dark" ? <Sun className="h-4 w-4 text-text-tertiary" /> : <Moon className="h-4 w-4 text-text-tertiary" />}
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </button>
        </div>
      </div>

      {/* Account */}
      <div className={`mt-4 ${cardCls}`}>
        <h2 className="text-base font-medium text-text-primary">Account</h2>
        <div className="mt-3 flex flex-col gap-0.5">
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
        <div className="mt-3 flex flex-col gap-0.5">
          <button onClick={handleExportCsv} disabled={exporting} className={`${btnCls} disabled:opacity-50`}>
            <Download className="h-4 w-4 text-text-tertiary" />
            {exporting ? "Exporting..." : "Export as CSV"}
          </button>
          <button onClick={() => qc.invalidateQueries()} className={btnCls}>
            <RefreshCw className="h-4 w-4 text-text-tertiary" />
            Refresh data
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className={`mt-4 ${cardCls}`}>
        <h2 className="flex items-center gap-2 text-base font-medium text-text-primary">
          <Key className="h-4 w-4" />
          API Keys
        </h2>
        <p className="mt-1 text-sm text-text-tertiary">
          Create API keys to authenticate the Chrome extension with your Trackr account.
        </p>

        <form onSubmit={handleCreate} className="mt-4 flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Key label (e.g. 'My laptop')"
            className="flex-1 rounded-md border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={creating || !label.trim()}
            className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate
          </button>
        </form>

        {newRawKey && (
          <div className="mt-4 rounded-md border border-blue-400/30 bg-blue-400/10 p-4">
            <p className="text-sm font-medium text-blue-400">
              API key created! Copy it now — it won't be shown again.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-surface-primary px-3 py-2 text-xs text-text-primary">
                {newRawKey}
              </code>
              <button
                onClick={handleCopy}
                className="rounded-md p-2 text-text-tertiary transition-colors hover:bg-surface-elevated"
                title="Copy to clipboard"
              >
                {copied ? <Check className="h-4 w-4 text-blue-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={() => setNewRawKey(null)}
              className="mt-2 text-xs text-text-tertiary hover:text-text-secondary"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-text-tertiary">Loading...</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-text-tertiary">No API keys yet.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{k.label}</p>
                    <p className="text-xs text-text-tertiary">
                      Created {new Date(k.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Extension instructions */}
      <div className={`mt-4 ${cardCls}`}>
        <h2 className="text-base font-medium text-text-primary">Chrome Extension Setup</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-text-secondary">
          <li>Generate an API key above</li>
          <li>Load the extension from the <code className="rounded bg-surface-primary px-1.5 py-0.5 text-xs">extension/</code> folder in <code className="rounded bg-surface-primary px-1.5 py-0.5 text-xs">chrome://extensions</code> (enable Developer mode)</li>
          <li>Click the extension icon, then "Settings"</li>
          <li>Paste your API key and server URL</li>
          <li>Navigate to a LinkedIn or Greenhouse job posting and click the extension to save it</li>
        </ol>
      </div>

      {/* Links */}
      <div className={`mt-4 mb-8 ${cardCls}`}>
        <h2 className="text-base font-medium text-text-primary">Links</h2>
        <div className="mt-3">
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
