export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Line {
  y: number;
  minX: number;
  maxX: number;
  height: number;
  text: string;
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const SENTENCE_END = /[.!?…:]["'”’)\]]*$/;

/** Group positioned text fragments into lines, then lines into paragraphs. */
export function buildPdfParagraphs(items: PdfTextItem[]): string[] {
  const usable = items.filter((it) => it.str.trim().length > 0);
  if (!usable.length) return [];

  const typicalHeight = median(usable.map((i) => i.height).filter((h) => h > 0)) || 10;
  const yTol = typicalHeight * 0.5;

  // 1. fragments -> lines
  const sorted = [...usable].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: PdfTextItem[][] = [];
  for (const it of sorted) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - it.y) <= yTol) row.push(it);
    else rows.push([it]);
  }

  const lines: Line[] = rows.map((row) => {
    row.sort((a, b) => a.x - b.x);
    let text = "";
    let prevEnd: number | null = null;
    for (const it of row) {
      if (text && prevEnd !== null) {
        const gap = it.x - prevEnd;
        const needsSpace = !/\s$/.test(text) && !/^\s/.test(it.str) && gap > typicalHeight * 0.12;
        if (needsSpace) text += " ";
      }
      text += it.str;
      prevEnd = it.x + it.width;
    }
    return {
      y: row[0].y,
      minX: row[0].x,
      maxX: Math.max(...row.map((r) => r.x + r.width)),
      height: Math.max(...row.map((r) => r.height || typicalHeight)),
      text: text.replace(/\s+/g, " ").trim(),
    };
  });

  // 2. lines -> paragraphs
  const gaps = lines.slice(1).map((l, i) => lines[i].y - l.y).filter((g) => g > 0);
  const normalGap = median(gaps) || typicalHeight * 1.3;
  const leftEdge = median(lines.map((l) => l.minX));
  const maxWidth = Math.max(...lines.map((l) => l.maxX - l.minX), 1);

  const paragraphs: string[] = [];
  let current = "";
  lines.forEach((line, i) => {
    if (i === 0) {
      current = line.text;
      return;
    }
    const prev = lines[i - 1];
    const gap = prev.y - line.y;
    const bigGap = gap > normalGap * 1.45;
    const indented = line.minX - leftEdge > typicalHeight * 0.9 && SENTENCE_END.test(prev.text);
    const shortPrev = prev.maxX - prev.minX < maxWidth * 0.6 && SENTENCE_END.test(prev.text);

    if (bigGap || indented || shortPrev) {
      if (current.trim()) paragraphs.push(current.trim());
      current = line.text;
    } else if (/[A-Za-z]-$/.test(current) && /^[a-z]/.test(line.text)) {
      current = current.slice(0, -1) + line.text; // de-hyphenate "reader-\nship"
    } else {
      current += " " + line.text;
    }
  });
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs;
}
