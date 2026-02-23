import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, loading]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      : "bg-accent text-white hover:bg-accent-hover disabled:opacity-50";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => !loading && e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border-default bg-surface-secondary p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="text-base font-semibold text-text-primary">
          {title}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            type="button"
            className="rounded-lg border border-border-default px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${confirmClass}`}
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
