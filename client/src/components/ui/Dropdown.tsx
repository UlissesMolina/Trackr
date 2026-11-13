import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { useExitTransition } from "../../hooks/useExitTransition";

interface DropdownProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
  style?: React.CSSProperties;
  /** Classes for the wrapper, e.g. "w-full" inside a form grid. */
  wrapperClassName?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}

const CLOSE_MS = 120; // matches .animate-menu-out
const MENU_MAX_H = 280;

type MenuPos = { top: number; left: number; minWidth: number; openUp: boolean };

/**
 * A select replacement whose menu animates in and out (native selects can't).
 * The menu is portaled to <body> so dialogs' scroll areas don't clip it.
 */
export default function Dropdown<T extends string>({
  value,
  options,
  onChange,
  className = "",
  style,
  wrapperClassName = "",
  align = "left",
  ariaLabel,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = useExitTransition(open, CLOSE_MS);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const current = options.find((o) => o.value === value) ?? options[0];

  function openMenu() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(v: T) {
    if (v !== value) onChange(v);
    setOpen(false);
  }

  // Place the menu under the button (or above it when there's no room below).
  useLayoutEffect(() => {
    if (!mounted) return;
    function place() {
      const r = buttonRef.current?.getBoundingClientRect();
      if (!r) return;
      const openUp = window.innerHeight - r.bottom < MENU_MAX_H && r.top > window.innerHeight - r.bottom;
      setPos({
        top: openUp ? r.top - 6 : r.bottom + 6,
        left: align === "right" ? r.right : r.left,
        minWidth: r.width,
        openUp,
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [mounted, align]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

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
      e.stopPropagation(); // don't also close a surrounding dialog
      setOpen(false);
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
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex items-center justify-between gap-2 text-left ${className}`}
        style={style}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-text-tertiary transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {mounted &&
        pos &&
        createPortal(
          // Outer div positions (its transform anchors the menu); inner list animates.
          <div
            className="fixed z-[60]"
            style={{
              top: pos.top,
              left: pos.left,
              minWidth: pos.minWidth,
              transform: [
                align === "right" ? "translateX(-100%)" : "",
                pos.openUp ? "translateY(-100%)" : "",
              ].join(" "),
            }}
          >
          <ul
            ref={menuRef}
            role="listbox"
            className={`overflow-y-auto rounded-lg border border-border-default bg-surface-secondary py-1 shadow-lg ${
              closing ? "animate-menu-out" : "animate-menu-in"
            }`}
            style={{ maxHeight: MENU_MAX_H, transformOrigin: pos.openUp ? "bottom" : "top" }}
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
          </div>,
          document.body
        )}
    </div>
  );
}
