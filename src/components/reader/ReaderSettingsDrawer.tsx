"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, X, Maximize2, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useReaderStore } from "@/stores/useReaderStore";
import {
  FONT_OPTIONS,
  READER_LIMITS,
  THEME_OPTIONS,
  fontStack,
} from "@/lib/readerStyle";
import type { ReaderWidth, AnimationIntensity } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const WIDTHS: { value: ReaderWidth; label: string }[] = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "wide", label: "Wide" },
];

const INTENSITY_OPTIONS: { value: AnimationIntensity; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "subtle", label: "Subtle" },
  { value: "ambient", label: "Ambient" },
];

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="eyebrow">{label}</legend>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className="seg"
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Slider({
  id,
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="eyebrow">{label}</label>
        <span className="text-xs tabular-nums text-text-muted">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range"
      />
    </div>
  );
}

export function ReaderSettingsDrawer({ open, onClose }: Props) {
  const { settings, updateSettings, resetSettings } = useReaderStore();
  const { setTheme } = useTheme();
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const scrollPosRef = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Preserve drawer scroll position across any setting changes/re-renders
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    scrollPosRef.current = e.currentTarget.scrollTop;
  };

  useEffect(() => {
    if (panelRef.current && scrollPosRef.current > 0) {
      panelRef.current.scrollTop = scrollPosRef.current;
    }
  });

  // Trap focus and handle Escape key without re-focusing on every re-render
  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        returnFocusRef.current?.focus?.();
      }
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      // Focus initial button with preventScroll to prevent drawer jumping
      const panel = panelRef.current;
      panel?.querySelector<HTMLElement>("button, input")?.focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== "Tab" || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>("button:not([disabled]), input, [href]");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;
  const L = READER_LIMITS;

  // Rendered in a portal so it always uses the site theme, never the reader theme it overlays.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-end bg-black/35 sm:items-stretch" onMouseDown={onClose}>
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reader-settings-title"
        onScroll={handleScroll}
        onMouseDown={(e) => e.stopPropagation()}
        className="drawer-in max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 text-text shadow-calm-hover sm:max-h-none sm:w-[24rem] sm:rounded-none sm:rounded-l-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 id="reader-settings-title" className="font-serif text-xl font-semibold">Typography</h2>
          <button type="button" onClick={onClose} aria-label="Close reader settings" className="icon-btn">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-7">
          <fieldset className="space-y-2">
            <legend className="eyebrow">Theme</legend>
            <div className="grid grid-cols-5 gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={settings.theme === t.value}
                  aria-label={`${t.label} theme`}
                  onClick={() => {
                    updateSettings({ theme: t.value });
                    setTheme(t.value === "night" || t.value === "true-dark" ? "dark" : "light");
                  }}
                  className="theme-swatch"
                  style={{ background: t.bg, color: t.fg }}
                >
                  <span className="font-serif text-lg leading-none">Aa</span>
                  <span className="text-[10px] font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="eyebrow">Typeface</legend>
            <div className="grid grid-cols-1 gap-1.5">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={settings.fontFamily === f.value}
                  onClick={() => updateSettings({ fontFamily: f.value })}
                  className="seg justify-between text-left"
                  style={{ fontFamily: f.stack, fontSize: 15 }}
                >
                  <span>{f.label}</span>
                  <span className="opacity-60">Aa</span>
                </button>
              ))}
            </div>
          </fieldset>

          <Slider id="rs-font-size" label="Font size" display={`${settings.fontSize}px`} value={settings.fontSize}
            min={L.fontSize.min} max={L.fontSize.max} step={L.fontSize.step}
            onChange={(v) => updateSettings({ fontSize: v })} />

          <Slider id="rs-line-height" label="Line height" display={settings.lineHeight.toFixed(2)} value={settings.lineHeight}
            min={L.lineHeight.min} max={L.lineHeight.max} step={L.lineHeight.step}
            onChange={(v) => updateSettings({ lineHeight: v })} />

          <Slider id="rs-para-spacing" label="Paragraph spacing" display={`${settings.paragraphSpacing.toFixed(2)}rem`}
            value={settings.paragraphSpacing} min={L.paragraphSpacing.min} max={L.paragraphSpacing.max}
            step={L.paragraphSpacing.step} onChange={(v) => updateSettings({ paragraphSpacing: v })} />

          <Segmented label="Weight" value={settings.fontWeight}
            options={[{ value: 400, label: "Regular" }, { value: 600, label: "Heavier" }]}
            onChange={(v) => updateSettings({ fontWeight: v })} />

          <Segmented label="Alignment" value={settings.textAlign}
            options={[{ value: "left", label: "Left" }, { value: "justify", label: "Justified" }]}
            onChange={(v) => updateSettings({ textAlign: v })} />

          <Segmented label="Column width" value={settings.contentWidth} options={WIDTHS}
            onChange={(v) => updateSettings({ contentWidth: v })} />

          <div className="space-y-1.5">
            <Segmented
              label="Atmospheric Animation"
              value={settings.animationIntensity}
              options={INTENSITY_OPTIONS}
              onChange={(v) => updateSettings({ animationIntensity: v })}
            />
            <p className="text-[11px] text-text-muted leading-tight">
              Subtle genre-tailored lighting, drifting motes, and ambient environmental motion that remains behind text.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-soft/60 p-4 text-xs text-text-muted space-y-1">
            <p className="font-semibold text-text flex items-center gap-1.5 text-sm">
              <Maximize2 className="h-4 w-4 text-primary" /> Full-Screen Reader Mode
            </p>
            <p className="leading-relaxed">
              Double-click anywhere on the reading page to enter or exit distraction-free full screen mode (or press <kbd className="rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10px]">Esc</kbd>).
            </p>
          </div>

          <p className="rounded-2xl border border-border p-4 text-text-muted" style={{
            fontFamily: fontStack(settings.fontFamily), fontWeight: settings.fontWeight, fontSize: Math.min(settings.fontSize, 20),
            lineHeight: settings.lineHeight, textAlign: settings.textAlign,
          }}>
            The lantern warmed the quiet room, and every page turned like a small sunrise.
          </p>

          <button type="button" onClick={resetSettings} className="btn btn-ghost w-full">
            <RotateCcw className="h-3.5 w-3.5" /> Reset typography
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}
