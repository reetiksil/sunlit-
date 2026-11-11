import type { CSSProperties } from "react";
import type {
  AnimationIntensity,
  ReaderFontFamily,
  ReaderFontWeight,
  ReaderSettings,
  ReaderTheme,
  ReaderWidth,
} from "@/types";

export const READER_LIMITS = {
  fontSize: { min: 14, max: 30, step: 1 },
  lineHeight: { min: 1.4, max: 2.2, step: 0.05 },
  paragraphSpacing: { min: 0.5, max: 2, step: 0.05 },
} as const;

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  fontSize: 19,
  fontFamily: "serif",
  fontWeight: 400,
  lineHeight: 1.8,
  paragraphSpacing: 1.25,
  textAlign: "left",
  contentWidth: "medium",
  theme: "day",
  readerMode: false,
  animationIntensity: "ambient",
};

export const FONT_OPTIONS: { value: ReaderFontFamily; label: string; stack: string }[] = [
  { value: "serif", label: "Lora", stack: "var(--font-lora), Lora, Georgia, serif" },
  { value: "modern-serif", label: "Merriweather", stack: "var(--font-merriweather), Merriweather, Georgia, serif" },
  { value: "sans", label: "DM Sans", stack: "var(--font-sans), 'DM Sans', system-ui, sans-serif" },
  { value: "dyslexic", label: "Atkinson", stack: "var(--font-atkinson), 'Atkinson Hyperlegible', sans-serif" },
  { value: "mono", label: "Mono", stack: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace" },
];

export const THEME_OPTIONS: { value: ReaderTheme; label: string; bg: string; fg: string }[] = [
  { value: "day", label: "Day", bg: "#FCF9F2", fg: "#182230" },
  { value: "sepia", label: "Sepia", bg: "#F5EEDB", fg: "#2D2115" },
  { value: "paper", label: "Paper", bg: "#F9F7F2", fg: "#171717" },
  { value: "night", label: "Night", bg: "#0F172A", fg: "#F1F5F9" },
  { value: "true-dark", label: "Black", bg: "#000000", fg: "#F8FAFC" },
];

// Widths are rem-based on purpose: a `ch` width would grow with the font size and make the
// layout feel like page zoom. Font size must only change the text, never the column.
export const WIDTH_REM: Record<ReaderWidth, number> = { narrow: 34, medium: 42, wide: 52 };

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

const FAMILIES = FONT_OPTIONS.map((f) => f.value);
const THEMES = THEME_OPTIONS.map((t) => t.value);

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Merge untrusted/partial settings (e.g. from old localStorage) onto defaults and clamp every value. */
export function sanitizeSettings(raw: Partial<ReaderSettings> | null | undefined): ReaderSettings {
  const d = DEFAULT_READER_SETTINGS;
  const r = (raw ?? {}) as Record<string, unknown>;
  const L = READER_LIMITS;
  const ANIMATION_INTENSITIES: AnimationIntensity[] = ["ambient", "subtle", "off"];
  const animIntensity = ANIMATION_INTENSITIES.includes(r.animationIntensity as AnimationIntensity)
    ? (r.animationIntensity as AnimationIntensity)
    : d.animationIntensity;

  return {
    fontSize: Math.round(clamp(num(r.fontSize, d.fontSize), L.fontSize.min, L.fontSize.max)),
    fontFamily: FAMILIES.includes(r.fontFamily as ReaderFontFamily) ? (r.fontFamily as ReaderFontFamily) : d.fontFamily,
    fontWeight: (r.fontWeight === 600 ? 600 : 400) as ReaderFontWeight,
    lineHeight: Math.round(clamp(num(r.lineHeight, d.lineHeight), L.lineHeight.min, L.lineHeight.max) * 100) / 100,
    paragraphSpacing:
      Math.round(clamp(num(r.paragraphSpacing, d.paragraphSpacing), L.paragraphSpacing.min, L.paragraphSpacing.max) * 100) / 100,
    textAlign: r.textAlign === "justify" ? "justify" : "left",
    contentWidth: r.contentWidth === "narrow" || r.contentWidth === "wide" ? r.contentWidth : "medium",
    theme: THEMES.includes(r.theme as ReaderTheme) ? (r.theme as ReaderTheme) : d.theme,
    readerMode: r.readerMode === true,
    animationIntensity: animIntensity,
  };
}

export function fontStack(family: ReaderFontFamily): string {
  return (FONT_OPTIONS.find((f) => f.value === family) ?? FONT_OPTIONS[0]).stack;
}

export function readerTextStyle(s: ReaderSettings): CSSProperties {
  return {
    fontFamily: fontStack(s.fontFamily),
    fontWeight: s.fontWeight,
    fontSize: `${s.fontSize}px`,
    lineHeight: s.lineHeight,
    textAlign: s.textAlign,
    hyphens: s.textAlign === "justify" ? "auto" : "manual",
    overflowWrap: "anywhere",
  };
}

export function readerColumnStyle(s: ReaderSettings): CSSProperties {
  return { maxWidth: `${WIDTH_REM[s.contentWidth]}rem` };
}
