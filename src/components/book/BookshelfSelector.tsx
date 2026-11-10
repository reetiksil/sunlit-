"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Bookmark, Check, ChevronDown } from "lucide-react";
import { ShelfCategory } from "@/types";

interface BookshelfSelectorProps {
  value: ShelfCategory | null;
  onChange: (category: ShelfCategory | null) => void;
}

const OPTIONS: { value: ShelfCategory | null; label: string }[] = [
  { value: "reading", label: "Currently Reading" },
  { value: "plan-to-read", label: "Plan to Read" },
  { value: "completed", label: "Completed" },
  { value: null, label: "Remove from Shelf" },
];

export function BookshelfSelector({ value, onChange }: BookshelfSelectorProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  const items = OPTIONS.filter((o) => !(o.value === null && value === null));

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    const idx = items.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    setOpen(true);
  }, [value, items]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[active]?.focus();
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, close]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const last = items.length - 1;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a >= last ? 0 : a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? last : a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(last); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") close(false);
  };

  const current = OPTIONS.find((o) => o.value === value && value !== null);

  return (
    <div className="relative inline-block text-left" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) { e.preventDefault(); openMenu(); }
        }}
        className="btn btn-ghost h-12 gap-2.5 bg-surface-soft"
      >
        <Bookmark className={`h-4 w-4 transition-colors ${value ? "fill-primary text-primary" : "text-text-muted"}`} aria-hidden />
        <span>{current ? current.label : "Add to Bookshelf"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label="Bookshelf status" onKeyDown={onMenuKey}
          className="menu-in absolute left-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-calm-hover">
          {items.map((opt, i) => {
            const selected = opt.value !== null && opt.value === value;
            const isRemove = opt.value === null;
            return (
              <React.Fragment key={opt.label}>
                {isRemove && <div role="separator" className="mx-2 my-1 h-px bg-border" />}
                <button
                  ref={(el) => { itemRefs.current[i] = el; }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => { onChange(opt.value); close(); }}
                  onMouseEnter={() => setActive(i)}
                  className={`menu-item ${selected ? "menu-item-selected" : ""} ${isRemove ? "text-text-muted" : ""}`}
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
