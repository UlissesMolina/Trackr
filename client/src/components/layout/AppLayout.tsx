import { UserButton } from "@clerk/clerk-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthToken } from "../../hooks/useAuthToken";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/" },
  { label: "Board", path: "/board" },
  { label: "Resume", path: "/resume" },
  { label: "Cover Letter", path: "/cover-letter" },
];

export default function AppLayout() {
  useAuthToken();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-surface-primary">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-60 flex-col border-r border-border-default bg-surface-secondary">
        <div className="flex h-14 items-center gap-2 border-b border-border-default px-5">
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Trackr
          </span>
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

        <div className="border-t border-border-default p-4">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: "h-7 w-7",
              },
            }}
          />
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
