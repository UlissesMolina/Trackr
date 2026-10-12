import { useState } from "react";
import Modal from "../ui/Modal";

interface FollowUpEmailModalProps {
  open: boolean;
  onClose: () => void;
  company: string;
  email: string | undefined;
  loading: boolean;
  error: string | null;
  onRegenerate: () => void;
}

export default function FollowUpEmailModal({
  open,
  onClose,
  company,
  email,
  loading,
  error,
  onRegenerate,
}: FollowUpEmailModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — the text is still selectable in the textarea.
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Follow up with ${company}`}>
      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-surface-tertiary" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <textarea
          aria-label="Follow-up email draft"
          readOnly
          value={email ?? ""}
          rows={12}
          className="w-full resize-none rounded-lg border border-border-default bg-surface-primary p-3 text-sm leading-relaxed text-text-primary"
        />
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="rounded-lg border border-border-default px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-elevated disabled:opacity-50"
        >
          Regenerate
        </button>
        <button
          onClick={handleCopy}
          disabled={loading || !email}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </Modal>
  );
}
