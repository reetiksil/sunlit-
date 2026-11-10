import { describe, it, expect } from "vitest";
import { buildPdfParagraphs } from "@/lib/pdfText";

const item = (str: string, x: number, y: number) => ({ str, x, y, width: str.length * 5, height: 12 });

describe("buildPdfParagraphs", () => {
  it("splits on large vertical gaps, joins wrapped lines and de-hyphenates", () => {
    const out = buildPdfParagraphs([
      item("It was a quiet morning and the reader-", 50, 700),
      item("ship grew slowly across the valley.", 50, 686),
      item("Second paragraph begins here after a gap.", 50, 658),
      item("It continues on this line too.", 50, 644),
    ]);
    expect(out).toEqual([
      "It was a quiet morning and the readership grew slowly across the valley.",
      "Second paragraph begins here after a gap. It continues on this line too.",
    ]);
  });

  it("returns nothing for image-only pages", () => {
    expect(buildPdfParagraphs([])).toEqual([]);
    expect(buildPdfParagraphs([item("   ", 0, 0)])).toEqual([]);
  });
});
