import { describe, it, expect } from "vitest";
import { validateBookFile } from "@/lib/validations";
import { siteConfig } from "@/config/site";

describe("Upload & Read Zod File Validation", () => {
  it("accepts valid .epub and .pdf files within size limit", () => {
    expect(validateBookFile({ name: "novel.epub", size: 4 * 1024 * 1024 }).success).toBe(true);
    expect(validateBookFile({ name: "story.pdf", size: 10 * 1024 * 1024 }).success).toBe(true);
  });

  it("accepts plain text and markdown, with a smaller size cap", () => {
    expect(validateBookFile({ name: "notes.txt", size: 1024 }).success).toBe(true);
    expect(validateBookFile({ name: "notes.md", size: 1024 }).success).toBe(true);
    expect(validateBookFile({ name: "big.txt", size: 3 * 1024 * 1024 }).success).toBe(false);
  });

  it("rejects empty files", () => {
    expect(validateBookFile({ name: "empty.pdf", size: 0 }).success).toBe(false);
  });

  it("rejects unsupported file extensions", () => {
    const res = validateBookFile({ name: "malware.exe", size: 1024 });
    expect(res.success).toBe(false);
  });

  it("rejects files larger than maxUploadSizeBytes (25 MB)", () => {
    const res = validateBookFile({
      name: "huge.pdf",
      size: siteConfig.maxUploadSizeBytes + 1024,
    });
    expect(res.success).toBe(false);
  });
});