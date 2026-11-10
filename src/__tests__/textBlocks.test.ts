import { describe, it, expect } from "vitest";
import { checkText, parseTextToBlocks, TEXT_LIMITS } from "@/lib/textBlocks";

describe("parseTextToBlocks", () => {
  it("keeps paragraphs, single line breaks, headings and lists", () => {
    const blocks = parseTextToBlocks("# Title\n\nLine one\nLine two\n\n- a\n- b\n\n1. x\n2. y\n\nLast.");
    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "Title" },
      { type: "paragraph", text: "Line one\nLine two" },
      { type: "list", ordered: false, items: ["a", "b"] },
      { type: "list", ordered: true, items: ["x", "y"] },
      { type: "paragraph", text: "Last." },
    ]);
  });

  it("recognises underlined headings and CRLF input", () => {
    const blocks = parseTextToBlocks("Chapter Two\r\n===========\r\n\r\nText.");
    expect(blocks[0]).toEqual({ type: "heading", level: 1, text: "Chapter Two" });
    expect(blocks[1]).toEqual({ type: "paragraph", text: "Text." });
  });
});

describe("checkText", () => {
  it("rejects empty, oversized and binary-looking input", () => {
    expect(checkText("   \n ").ok).toBe(false);
    expect(checkText("a".repeat(TEXT_LIMITS.maxChars + 1)).ok).toBe(false);
    expect(checkText("\u0000\u0001\u0002\u0003abc").ok).toBe(false);
  });

  it("normalises line endings and strips a BOM", () => {
    const r = checkText("\uFEFFhello\r\nworld");
    expect(r.ok && r.text).toBe("hello\nworld");
  });
});
