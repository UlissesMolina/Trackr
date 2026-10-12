import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useApplications } from "../../hooks/useApplications";
import { getNotifications, type Notification } from "../../lib/notifications";
import { formatRelativeDateTime } from "../../lib/utils";
import { INTERVIEW_TYPE_LABELS } from "../../lib/constants";

const RED = "text-red-400";
const AMBER = "text-yellow-400";
const MUTED = "text-text-tertiary";

function describe(item: Notification): { what: string; when: string; tone: string } {
  if (item.kind === "INTERVIEW") {
    const type = item.interview ? INTERVIEW_TYPE_LABELS[item.interview.type] : "";
    return {
      what: `${type} interview`.trim(),
      when: item.date ? formatRelativeDateTime(item.date) : "",
      tone: "text-accent",
    };
  }

  const platform = item.application.onlineAssessment?.platform;
  const what = platform ? `${platform} OA` : "Online assessment";
  const days = item.days;
  if (days === null) return { what, when: "No due date", tone: MUTED };
  if (days < 0) return { what, when: `Overdue by ${-days}d`, tone: RED };
  if (days === 0) return { what, when: "Due today", tone: AMBER };
  if (days === 1) return { what, when: "Due tomorrow", tone: AMBER };
  return { what, when: `Due in ${days}d`, tone: days <= 3 ? AMBER : MUTED };
}

export default function NotificationsBell() {
  const { data: applications, isLoading } = useApplications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => getNotifications(applications ?? [], new Date()), [applications]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const count = items.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={count > 0 ? `Notifications (${count})` : "Notifications"}
        aria-expanded={open}
        className="relative rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-elevated hover:text-text-primary"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border-default bg-surface-secondary shadow-2xl">
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">Notifications</p>
            <p className="text-xs text-text-tertiary">Pending OAs and interviews this week</p>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-tertiary" />
              ))}
            </div>
          ) : count === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-text-tertiary">Nothing coming up</p>
              <p className="mt-1 text-xs text-text-tertiary">
                Add an OA or interview on an application to see it here
              </p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {items.map((item) => {
                const { what, when, tone } = describe(item);
                return (
                  <li key={item.key}>
                    <Link
                      to={`/applications/${item.application.id}`}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 transition-colors hover:bg-surface-tertiary"
                    >
                      <p className="truncate text-sm text-text-primary">
                        {item.application.company}
                        <span className="text-text-tertiary"> — {item.application.title}</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs">
                        <span className="text-text-secondary">{what}</span>
                        <span className={tone}> · {when}</span>
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
