"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
  sublabel?: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select an option…",
  searchable = false,
  searchPlaceholder = "Type to search…",
  className = "",
  buttonClassName = "",
  ariaLabel,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open, searchable]);

  const filteredOptions = searchable && search.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  return (
    <div className={`relative inline-block w-full text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text shadow-sm transition-all hover:bg-surface-soft hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 ${buttonClassName}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-text-muted">{placeholder}</span>}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
            open ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 text-text shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
          {searchable && (
            <div className="sticky top-0 z-10 border-b border-border/70 bg-surface px-2 pb-2 pt-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border border-border bg-bg pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div role="listbox" className="space-y-0.5 pt-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-center text-xs text-text-muted">No matches found</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-primary font-semibold text-primary-fg"
                        : "text-text hover:bg-surface-soft hover:text-primary"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate leading-snug">{opt.label}</p>
                      {opt.sublabel && (
                        <p className={`text-xs ${isSelected ? "text-primary-fg/80" : "text-text-muted"}`}>
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
