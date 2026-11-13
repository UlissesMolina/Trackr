import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface DropdownProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
  style?: React.CSSProperties;
  align?: "left" | "right";
  ariaLabel?: string;
}

const CLOSE_MS = 120; // matches .animate-menu-out

/** A select replacement whose menu animates in and out (native selects can't). */
export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  className = "",
  style,
  align = "left",
  ariaLabel,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const current = options.find((o) => o.value === value) ?? options[0];

  function openMenu() {
    clearTimeout(closeTimer.current);
    setClosing(false);
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function closeMenu() {
    if (!open || closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, CLOSE_MS);
  }

  function choose(v: T) {
    if (v !== value) onChange(v);
    closeMenu();
  }

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeMenu();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  });

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[active].value);
    } else if (e.key === "Tab") {
      closeMenu();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open && !closing}
        aria-label={ariaLabel}
        onClick={() => (open && !closing ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex items-center gap-2 ${className}`}
        style={style}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform duration-150 ${
            open && !closing ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute z-30 mt-1.5 min-w-full overflow-hidden rounded-lg border border-border-default bg-surface-secondary py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${closing ? "animate-menu-out" : "animate-menu-in"}`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
                className={`flex cursor-pointer items-center justify-between gap-4 whitespace-nowrap px-3 py-1.5 text-sm transition-colors ${
                  i === active ? "bg-[var(--color-nav-hover)]" : ""
                } ${selected ? "font-medium text-[var(--color-nav-active-text)]" : "text-text-primary"}`}
              >
                {o.label}
                {selected && <Check className="h-3.5 w-3.5" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
