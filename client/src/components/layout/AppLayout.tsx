import { useState, useEffect, useRef, useCallback } from "react";
import { UserButton } from "@clerk/clerk-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthToken } from "../../hooks/useAuthToken";
import { LayoutDashboard, LayoutGrid, Briefcase, GitBranch, FileText, FileEdit, PanelLeftClose, PanelLeft, Search, Bell, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Board", path: "/board", icon: LayoutGrid },
  { label: "Jobs", path: "/jobs", icon: Briefcase },
  { label: "Flow", path: "/flow", icon: GitBranch },
  { label: "Resume", path: "/resume", icon: FileText },
  { label: "Cover Letter", path: "/cover-letter", icon: FileEdit },
  { label: "Settings", path: "/settings", icon: Settings },
];

const SIDEBAR_COLLAPSED_KEY = "trackr-sidebar-collapsed";

function getSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function AppLayout() {
  const authReady = useAuthToken();
  const { pathname } = useLocation();
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
          <UserButton
            afterSignOutUrl="/"
            appearance={{ elements: { avatarBox: "h-8 w-8" } }}
          />
        </div>
      </header>

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
