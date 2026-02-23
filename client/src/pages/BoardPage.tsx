import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  useApplications,
  useCreateApplication,
  useUpdateApplicationStatus,
} from "../hooks/useApplications";
import {
  BOARD_STATUSES,
  STATUS_LABELS,
  STATUS_DOT_COLORS,
  boardStatus,
  type BoardStatus,
} from "../lib/constants";
import ApplicationCard from "../components/applications/ApplicationCard";
import ApplicationForm, {
  type ApplicationFormData,
} from "../components/applications/ApplicationForm";
import Modal from "../components/ui/Modal";
import ImportModal from "../components/applications/ImportModal";

interface DragState {
  id: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
}

const INPUT =
  "rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export default function BoardPage() {
  const { data: applications = [], isLoading } = useApplications();
  const createMutation = useCreateApplication();
  const statusMutation = useUpdateApplicationStatus();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "7" | "30">("all");
  const [stageJump, setStageJump] = useState<BoardStatus | "ALL">("ALL");

  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverStatus, setHoverStatus] = useState<BoardStatus | null>(null);
  const columnRefs = useRef<Map<BoardStatus, HTMLDivElement>>(new Map());

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !app.title.toLowerCase().includes(q) &&
          !app.company.toLowerCase().includes(q)
        )
          return false;
      }
      if (dateFilter !== "all" && app.dateApplied) {
        const days = parseInt(dateFilter);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        if (new Date(app.dateApplied) < cutoff) return false;
      }
      return true;
    });
  }, [applications, search, dateFilter]);

  useEffect(() => {
    if (stageJump === "ALL") return;
    const col = columnRefs.current.get(stageJump);
    if (col) col.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setStageJump("ALL");
  }, [stageJump]);

  function handleCreate(form: ApplicationFormData) {
    createMutation.mutate(
      {
        title: form.title,
        company: form.company,
        location: form.location || undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        url: form.url || undefined,
        status: form.status,
        dateApplied: form.dateApplied || undefined,
        followUpDate: form.followUpDate || undefined,
      },
      { onSuccess: () => setShowForm(false) }
    );
  }

  function handlePointerDown(e: React.PointerEvent, appId: string) {
    if (e.button !== 0) return;
    const card = (e.target as HTMLElement).closest("[data-card-id]") as HTMLElement | null;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    e.preventDefault();

    setDrag({
      id: appId,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
    });
  }

  const getStatusAtPoint = useCallback((x: number, y: number): BoardStatus | null => {
    for (const [status, el] of columnRefs.current) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return status;
      }
    }
    return null;
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    setDrag((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    setHoverStatus(getStatusAtPoint(e.clientX, e.clientY));
  }, [getStatusAtPoint]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    setDrag((prev) => {
      if (!prev) return null;
      const targetStatus = getStatusAtPoint(e.clientX, e.clientY);
      if (targetStatus) {
        const app = applications.find((a) => a.id === prev.id);
        if (app && app.status !== targetStatus) {
          statusMutation.mutate({ id: prev.id, status: targetStatus });
        }
      }
      return null;
    });
    setHoverStatus(null);
  }, [applications, getStatusAtPoint, statusMutation]);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drag, handlePointerMove, handlePointerUp]);

  const draggedApp = drag ? applications.find((a) => a.id === drag.id) : null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-secondary">Loading applications...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Application Board</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by company or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${INPUT} w-full pl-9`}
          />
        </div>
        <select
          value={stageJump}
          onChange={(e) => setStageJump(e.target.value as BoardStatus | "ALL")}
          className={INPUT}
        >
          <option value="ALL">All Stages</option>
          {BOARD_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as "all" | "7" | "30")}
          className={INPUT}
        >
          <option value="all">All Time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
        {(search || dateFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setDateFilter("all"); }}
            className="text-xs text-text-tertiary hover:text-text-secondary"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 sm:gap-4">
        {BOARD_STATUSES.map((status) => {
          const cards = filteredApps.filter((a) => boardStatus(a.status) === status);
          const isDropTarget = drag && hoverStatus === status;

          return (
            <div
              key={status}
              ref={(el) => { if (el) columnRefs.current.set(status, el); }}
              className={`flex w-64 min-w-[16rem] flex-shrink-0 flex-col rounded-xl p-3 transition-colors duration-150 sm:w-72 sm:min-w-[18rem] ${
                isDropTarget
                  ? "bg-accent/10 ring-2 ring-accent/30"
                  : "bg-surface-secondary"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT_COLORS[status]}`} />
                  <h2 className="text-sm font-semibold text-text-secondary">
                    {STATUS_LABELS[status]}
                  </h2>
                </div>
                <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-xs font-medium text-text-tertiary">
                  {cards.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1.5">
                {cards.map((app) => (
                  <div
                    key={app.id}
                    data-card-id={app.id}
                    onPointerDown={(e) => handlePointerDown(e, app.id)}
                    className={`cursor-grab select-none transition-opacity duration-150 ${
                      drag?.id === app.id ? "opacity-30" : ""
                    }`}
                  >
                    <ApplicationCard application={app} />
                  </div>
                ))}

                {cards.length === 0 && (
                  <div className={`flex flex-1 flex-col items-center justify-center rounded-lg p-6 ${
                    isDropTarget ? "border-2 border-accent/40 bg-accent/5" : "border border-border-default bg-surface-tertiary/30"
                  }`}>
                    <p className="text-center text-sm text-text-secondary">
                      {search || dateFilter !== "all"
                        ? "No matches"
                        : "Drop cards here or add a new application"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {drag && draggedApp && createPortal(
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: drag.x - drag.offsetX,
            top: drag.y - drag.offsetY,
            width: drag.width,
          }}
        >
          <div className="rotate-[2deg] scale-105 rounded-lg border border-accent/40 bg-surface-secondary shadow-xl shadow-black/30">
            <ApplicationCard application={draggedApp} />
          </div>
        </div>,
        document.body
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Application">
        <ApplicationForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      <ImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  );
}
