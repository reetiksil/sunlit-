import type { ReaderSettings } from "@/types";
import { THEME_OPTIONS, fontStack } from "@/lib/readerStyle";

/** Minimal surface of epub.js we rely on (avoids coupling to its loosely-typed d.ts). */
export interface EpubRenditionLike {
  themes: {
    override: (name: string, value: string, priority?: boolean) => void;
    fontSize: (size: string) => void;
  };
  hooks: { content: { register: (fn: (contents: { document: Document }) => void) => void } };
  resize?: (w?: number | string, h?: number | string) => void;
  getContents?: () => Array<{ document: Document }>;
  destroy: () => void;
  display: (target?: string) => Promise<unknown>;
}

/** The EPUB renders inside an iframe that can't see the page's next/font @font-face rules, so copy them in. */
export function collectFontFaceCss(): string {
  let css = "";
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue; // cross-origin stylesheet
      }
      for (const rule of Array.from(rules)) {
        if (rule.constructor.name === "CSSFontFaceRule" || rule.cssText.startsWith("@font-face")) {
          css += rule.cssText.replace(/url\((["']?)(\/[^)"']+)\1\)/g, (_m, q, p) => `url(${q}${location.origin}${p}${q})`);
        }
      }
    }
  } catch {
    /* fonts fall back to the system stack */
  }
  return css;
}

/** Resolve `var(--font-x)` to the concrete family names next/font generated. */
function resolveStack(stack: string): string {
  return stack.replace(/var\((--[\w-]+)\)/g, (_m, name) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || "serif";
  });
}

export function applyEpubTypography(r: EpubRenditionLike, s: ReaderSettings) {
  const theme = THEME_OPTIONS.find((t) => t.value === s.theme) ?? THEME_OPTIONS[0];
  const o = r.themes.override;
  r.themes.fontSize(`${s.fontSize}px`);
  o("font-family", resolveStack(fontStack(s.fontFamily)), true);
  o("font-weight", String(s.fontWeight), true);
  o("line-height", String(s.lineHeight), true);
  o("text-align", s.textAlign, true);
  o("color", theme.fg, true);
  o("background", theme.bg, true);
  o("hyphens", s.textAlign === "justify" ? "auto" : "manual", true);
  r.getContents?.().forEach((c) => setSpacing(c.document, s.paragraphSpacing));
}

export function injectEpubBase(contents: { document: Document }, s: ReaderSettings) {
  const doc = contents.document;
  const style = doc.createElement("style");
  style.textContent = `${collectFontFaceCss()}
    body { padding: 0 0.5rem !important; max-width: 100%; }
    img, svg { max-width: 100% !important; height: auto !important; }`;
  doc.head.appendChild(style);
  setSpacing(doc, s.paragraphSpacing);
}

function setSpacing(doc: Document, rem: number) {
  let el = doc.getElementById("sunlit-spacing");
  if (!el) {
    el = doc.createElement("style");
    el.id = "sunlit-spacing";
    doc.head.appendChild(el);
  }
  el.textContent = `p { margin: 0 0 ${rem}rem 0 !important; }`;
}
