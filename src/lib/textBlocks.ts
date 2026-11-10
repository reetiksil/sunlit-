export type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

export const TEXT_LIMITS = {
  maxChars: 1_000_000,
  maxFileBytes: 2 * 1024 * 1024,
} as const;

export type TextCheck = { ok: true; text: string } | { ok: false; error: string };

/** Normalise and sanity-check raw text from a paste box or a .txt/.md upload. */
export function checkText(raw: string): TextCheck {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ");
  if (!text.trim()) return { ok: false, error: "There's nothing to read yet. Paste some text or choose a file." };
  if (text.length > TEXT_LIMITS.maxChars) {
    return {
      ok: false,
      error: `That text is too long (${text.length.toLocaleString()} characters). The limit is ${TEXT_LIMITS.maxChars.toLocaleString()}; try splitting it into parts.`,
    };
  }
  // eslint-disable-next-line no-control-regex
  const control = text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g)?.length ?? 0;
  if (control / text.length > 0.02) {
    return { ok: false, error: "This doesn't look like plain text. Try an .epub, .pdf, .txt or .md file." };
  }
  return { ok: true, text };
}

const LIST_ITEM = /^\s{0,3}([-*•+]|\d{1,3}[.)])\s+(.*\S.*)$/;
const ATX_HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const CHAPTER_HEADING = /^(?:chapter|act|scene|prologue|epilogue|part|book)\s*(?:[0-9ivxlcdm]+|[a-z]+)?(?::|\.|\s*[-–—]\s*|\s+.*)?$/i;
const PAGE_NUMBER = /^\s*(?:page\s+\d+(?:\s+of\s+\d+)?|\d+|[-–—]\s*\d+\s*[-–—])\s*$/i;

/** Reflow lines inside a paragraph: joins soft wraps, de-hyphenates, and collapses whitespace. */
function reflowParagraphLines(lines: string[]): string {
  if (!lines.length) return "";
  let result = "";
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    if (!result) {
      result = raw;
      continue;
    }
    // De-hyphenate "discov-\nered" -> "discovered"
    if (/[A-Za-z]-$/.test(result) && /^[A-Za-z]/.test(raw)) {
      result = result.slice(0, -1) + raw;
    } else {
      result += " " + raw;
    }
  }
  return result.replace(/[ \t]+/g, " ").trim();
}

/** Turn plain text / light markdown into comfortably formatted reading blocks. */
export function parseTextToBlocks(input: string): Block[] {
  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      const cleaned: string[] = [];
      for (let j = 0; j < para.length; j++) {
        if (j > 0 && /[A-Za-z]-$/.test(cleaned[cleaned.length - 1]) && /^[A-Za-z]/.test(para[j])) {
          cleaned[cleaned.length - 1] = cleaned[cleaned.length - 1].slice(0, -1) + para[j];
        } else {
          cleaned.push(para[j]);
        }
      }
      blocks.push({ type: "paragraph", text: cleaned.join("\n") });
    }
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: "list", ordered: list.ordered, items: list.items });
    list = null;
  };
  const flushAll = () => {
    flushPara();
    flushList();
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.replace(/\s+$/, "");
    const trimmed = line.trim();

    // Ignore stray page numbers / headers
    if (PAGE_NUMBER.test(trimmed)) {
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    // Markdown ATX Heading (# Heading)
    const atx = line.match(ATX_HEADING);
    if (atx) {
      flushAll();
      blocks.push({
        type: "heading",
        level: Math.min(3, atx[1].length) as 1 | 2 | 3,
        text: atx[2].trim(),
      });
      continue;
    }

    // Setext heading: single line followed by === or ---
    const next = lines[i + 1]?.trim() ?? "";
    if (para.length === 0 && !list && /^(=|-){3,}$/.test(next) && !LIST_ITEM.test(line)) {
      blocks.push({ type: "heading", level: next[0] === "=" ? 1 : 2, text: trimmed });
      i++;
      continue;
    }

    // Literary Chapter Heading Detection (e.g. "Chapter 1", "Prologue")
    if (para.length === 0 && !list && trimmed.length < 80 && CHAPTER_HEADING.test(trimmed)) {
      flushAll();
      blocks.push({ type: "heading", level: 1, text: trimmed });
      continue;
    }

    // List item
    const item = line.match(LIST_ITEM);
    if (item) {
      flushPara();
      const ordered = /\d/.test(item[1]);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(item[2].trim());
      continue;
    }

    // Indented continuation of previous list item
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += " " + trimmed;
      continue;
    }

    flushList();
    para.push(trimmed);
  }
  flushAll();
  return blocks;
}

export function blocksFromParagraphs(paragraphs: string[]): Block[] {
  return paragraphs
    .map((p) => p.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .map((text) => ({ type: "paragraph" as const, text }));
}

/** Pull a title from the first heading, otherwise from the first line (shortened). */
export function guessTitle(blocks: Block[], fallback: string): string {
  const first = blocks[0];
  if (!first) return fallback;
  const text = first.type === "list" ? first.items[0] : first.text.split("\n")[0];
  const t = text.trim();
  return t.length > 60 ? t.slice(0, 57).trimEnd() + "…" : t || fallback;
}
