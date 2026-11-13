import { useEffect, useState } from "react";

/**
 * Keeps something mounted for `ms` after `open` turns false so it can play an
 * exit animation. `closing` is true during that window.
 */
export function useExitTransition(open: boolean, ms: number) {
  const [mounted, setMounted] = useState(open);
  const [prevOpen, setPrevOpen] = useState(open);

  // Mount immediately on open (adjusting state during render, not in an effect).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setMounted(true);
  }

  useEffect(() => {
    if (open || !mounted) return;
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, mounted, ms]);

  return { mounted: open || mounted, closing: !open && mounted };
}
