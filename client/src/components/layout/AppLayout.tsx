import { useState, useEffect, useRef, useCallback } from "react";
import { UserButton, useClerk } from "@clerk/clerk-react";
import { useTheme } from "../../hooks/useTheme";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthToken } from "../../hooks/useAuthToken";
import api from "../../lib/api";
import { LayoutDashboard, LayoutGrid, Briefcase, GitBranch, FileText, FileEdit, PanelLeftClose, PanelLeft, Search, Bell, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Board", path: "/board", icon: LayoutGrid },
  { label: "Jobs", path: "/jobs", icon: Briefcase },
  { label: "Flow", path: "/flow", icon: GitBranch },
  { label: "Resume", path: "/resume", icon: FileText },
  { label: "Cover Letter", path: "/cover-letter", icon: FileEdit },
];

const SIDEBAR_COLLAPSED_KEY = "trackr-sidebar-collapsed";

function getSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function SettingsPanel({ onClose, theme }: { onClose: () => void; theme: ReturnType<typeof useTheme> }) {
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

  const sectionCls = "px-3 py-2" as const;
  const sectionLabelCls = "text-xs uppercase tracking-wider" as const;
  const btnCls = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors" as const;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="relative z-50 w-[220px] animate-settings-pop rounded-lg border border-border-default bg-surface-secondary p-1 shadow-lg"
      >
        <div className={sectionCls + " border-b border-border-subtle"}>
          <p className={sectionLabelCls + " font-medium text-text-tertiary"}>Appearance</p>
        </div>
        <button
          onClick={() => { theme.toggleTheme(); onClose(); }}
          className={btnCls + " text-text-primary hover:bg-surface-elevated"}
        >
          {theme.theme === "dark" ? (
            <>
              <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              Switch to light mode
            </>
          ) : (
            <>
              <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
              Switch to dark mode
            </>
          )}
        </button>
        <div className={sectionCls + " border-b border-border-subtle"}>
          <p className={sectionLabelCls + " font-medium text-text-tertiary"}>Account</p>
        </div>
        <button
          onClick={() => { openUserProfile(); onClose(); }}
          className={btnCls + " text-text-primary hover:bg-surface-elevated"}
        >
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.79 17.79 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          Manage account
        </button>
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className={btnCls + " text-text-primary hover:bg-surface-elevated"}
        >
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v3.75M9 12L3 9m0 0l6-3M3 9v12a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 21V9" />
          </svg>
          Sign out
        </button>
        <div className={sectionCls + " border-b border-border-subtle"}>
          <p className={sectionLabelCls + " font-medium text-text-tertiary"}>Data</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className={`${btnCls} text-text-primary hover:bg-surface-elevated disabled:opacity-50`}
        >
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {exporting ? "Exporting…" : "Export as CSV"}
        </button>
        <button
          onClick={handleClearCache}
          className={btnCls + " text-text-primary hover:bg-surface-elevated"}
        >
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Refresh data
        </button>
        <div className={sectionCls + " border-b border-border-subtle"}>
          <p className={sectionLabelCls + " font-medium text-text-tertiary"}>Links</p>
        </div>
        <a
          href="https://github.com/UlissesMolina/Trackr"
          target="_blank"
          rel="noopener noreferrer"
          className={btnCls + " text-text-primary hover:bg-surface-elevated"}
        >
          <svg className="h-4 w-4 text-text-tertiary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          GitHub
        </a>
      </div>
    </>
  );
}

export default function AppLayout() {
  const authReady = useAuthToken();
  const theme = useTheme();
  const { pathname } = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getSidebarCollapsed);
  const navRef = useRef<HTMLElement>(null);
  const [highlightStyle, setHighlightStyle] = useState({ y: 0, height: 0 });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const updateHighlight = useCallback(() => {
    if (!navRef.current) return;
    const activePath = NAV_ITEMS.find((n) =>
      n.path === "/" ? pathname === "/" : pathname.startsWith(n.path)
    )?.path;
    if (!activePath) { setHighlightStyle({ y: 0, height: 0 }); return; }
    const el = navRef.current.querySelector<HTMLElement>(`[data-nav-path="${activePath}"]`);
    if (!el) { setHighlightStyle({ y: 0, height: 0 }); return; }
    const navRect = navRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setHighlightStyle({
      y: elRect.top - navRect.top,
      height: elRect.height,
    });
  }, [pathname]);

  useEffect(() => {
    updateHighlight();
  }, [updateHighlight, sidebarCollapsed]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-primary">
      {/* Top navigation bar */}
      <header
        className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-5"
        style={{
          backgroundColor: "var(--color-header-bg)",
          borderBottom: "1px solid var(--color-header-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Left: Logo + mobile hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-text-tertiary md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <Link to="/" className="text-base font-semibold text-text-primary">
            Trackr
          </Link>
        </div>

        {/* Center-left: Search bar */}
        <div className="hidden h-[34px] w-[280px] items-center rounded-lg border border-border-default bg-surface-tertiary px-3 md:flex">
          <Search className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search applications..."
            className="ml-2 w-full border-none bg-transparent text-[13px] text-text-primary placeholder-text-tertiary outline-none"
          />
        </div>

        {/* Right: Icons + avatar */}
        <div className="flex items-center gap-4">
          <button
            className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-elevated"
            title="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
          <button
            className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-elevated"
            onClick={() => setSettingsOpen((p) => !p)}
            title="Settings"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
          <UserButton
            afterSignOutUrl="/"
            appearance={{ elements: { avatarBox: "h-8 w-8" } }}
          />
        </div>
      </header>

      {/* Settings panel (anchored to top bar) */}
      {settingsOpen && (
        <div className="fixed top-14 right-5 z-50">
          <SettingsPanel onClose={() => setSettingsOpen(false)} theme={theme} />
        </div>
      )}

      {/* Below top bar: sidebar + content */}
      <div className="flex flex-1" style={{ marginTop: "56px" }}>
        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            style={{ top: "56px" }}
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed left-0 bottom-0 z-40 flex flex-col bg-surface-primary transition-all duration-200 md:translate-x-0 md:z-10 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } ${sidebarCollapsed ? "md:w-16" : "w-60"}`}
          style={{ top: "56px", backgroundColor: "var(--color-sidebar-bg)", borderRight: "1px solid var(--color-sidebar-border)" }}
        >
          {/* Collapse toggle */}
          <div
            className={`flex items-center ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"} py-3`}
          >
            {!sidebarCollapsed && (
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1 text-text-tertiary md:hidden"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="hidden rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-elevated md:flex"
              title={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          <nav className="relative flex flex-1 flex-col gap-0.5 px-2" ref={navRef}>
            {/* Sliding highlight */}
            <div
              className="absolute left-2 right-2 rounded-lg transition-all duration-300 ease-in-out"
              style={{
                backgroundColor: "var(--color-nav-active)",
                height: highlightStyle.height,
                transform: `translateY(${highlightStyle.y}px)`,
                opacity: highlightStyle.height > 0 ? 1 : 0,
              }}
            />
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  data-nav-path={item.path}
                  className={`relative z-[1] flex items-center gap-3 rounded-lg text-sm transition-colors duration-200 ${
                    sidebarCollapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "font-medium text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  style={{
                    padding: sidebarCollapsed ? "7px 8px" : "7px 12px",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--color-nav-hover)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <Icon className="h-5 w-5 shrink-0" style={{ color: isActive ? "var(--color-icon-active)" : "var(--color-icon-muted)" }} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className={`w-full flex-1 ${sidebarCollapsed ? "md:ml-16" : "md:ml-60"}`}>
          <div className="px-5 pb-8 pt-6 md:px-10 md:pt-8">
            <div key={pathname} className="animate-page-enter">
              {authReady ? <Outlet /> : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-text-tertiary">Loading...</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
