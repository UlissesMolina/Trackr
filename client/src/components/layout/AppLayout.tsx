import { useState } from "react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "../../hooks/useAuthToken";
import api from "../../lib/api";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Board", path: "/board" },
  { label: "Jobs", path: "/jobs" },
  { label: "Flow", path: "/flow" },
  { label: "Resume", path: "/resume" },
  { label: "Cover Letter", path: "/cover-letter" },
];

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { openUserProfile, signOut } = useClerk();
  const [exporting, setExporting] = useState(false);

  async function handleExportCsv() {
    setExporting(true);
    try {
      const { data } = await api.get("/applications");
      const apps = data as Record<string, unknown>[];
      if (apps.length === 0) return;

      const cols: { key: string; label: string }[] = [
        { key: "title", label: "Title" },
        { key: "company", label: "Company" },
        { key: "location", label: "Location" },
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
          if (key === "dateApplied" && v) {
            const str = String(v);
            v = str.slice(0, 10);
          }
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

  function handleClearCache() {
    qc.invalidateQueries();
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute bottom-12 left-2 right-2 z-30 animate-settings-pop rounded-lg border border-border-default bg-surface-elevated p-1 shadow-xl">
        <div className="border-b border-border-default px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Account</p>
        </div>
        <button
          onClick={() => { openUserProfile(); onClose(); }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.79 17.79 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          Manage account
        </button>
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v3.75M9 12L3 9m0 0l6-3M3 9v12a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 21V9" />
          </svg>
          Sign out
        </button>
        <div className="border-b border-border-default px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Data</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {exporting ? "Exporting…" : "Export as CSV"}
        </button>
        <button
          onClick={handleClearCache}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh data
        </button>
        <div className="border-b border-border-default px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Links</p>
        </div>
        <a
          href="https://github.com/UlissesMolina/Trackr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          GitHub
        </a>
      </div>
    </>
  );
}

export default function AppLayout() {
  useAuthToken();
  const { pathname } = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-primary">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-border-default bg-surface-secondary px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 text-text-secondary"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="text-lg font-bold tracking-tight text-text-primary">Trackr</span>
        <UserButton
          afterSignOutUrl="/"
          appearance={{ elements: { avatarBox: "h-7 w-7" } }}
        />
      </header>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border-default bg-surface-secondary transition-transform duration-200 md:translate-x-0 md:z-10 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border-default px-5">
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Trackr
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1 text-text-tertiary md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === "/"
                ? pathname === "/"
                : pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-surface-elevated text-text-primary"
                    : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-border-default p-3">
          {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
          <div className="flex items-center justify-between">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7",
                },
              }}
            />
            <button
              onClick={() => setSettingsOpen((p) => !p)}
              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-secondary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="w-full flex-1 pt-14 md:ml-60 md:pt-0 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
