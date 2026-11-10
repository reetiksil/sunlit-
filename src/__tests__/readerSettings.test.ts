import { describe, it, expect } from "vitest";
import { sanitizeSettings, DEFAULT_READER_SETTINGS, READER_LIMITS, WIDTH_REM, readerTextStyle } from "@/lib/readerStyle";

describe("reader settings sanitising", () => {
  it("fills in missing keys from old persisted data", () => {
    const s = sanitizeSettings({ fontSize: 22, theme: "sepia" });
    expect(s.fontSize).toBe(22);
    expect(s.theme).toBe("sepia");
    expect(s.fontFamily).toBe(DEFAULT_READER_SETTINGS.fontFamily);
    expect(s.readerMode).toBe(false);
  });

  it("clamps out-of-range numbers and rejects bad enums", () => {
    const s = sanitizeSettings({ fontSize: 400, lineHeight: 0, paragraphSpacing: 99, theme: "neon" as never, fontFamily: "comic" as never });
    expect(s.fontSize).toBe(READER_LIMITS.fontSize.max);
    expect(s.lineHeight).toBe(READER_LIMITS.lineHeight.min);
    expect(s.paragraphSpacing).toBe(READER_LIMITS.paragraphSpacing.max);
    expect(s.theme).toBe("day");
    expect(s.fontFamily).toBe("serif");
  });

  it("survives null/garbage input", () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_READER_SETTINGS);
    expect(sanitizeSettings({ fontSize: NaN } as never).fontSize).toBe(DEFAULT_READER_SETTINGS.fontSize);
  });

  it("maps every setting onto the text style, with a column width independent of font size", () => {
    const style = readerTextStyle({ ...DEFAULT_READER_SETTINGS, fontSize: 26, fontWeight: 600, textAlign: "justify", fontFamily: "mono" });
    expect(style.fontSize).toBe("26px");
    expect(style.fontWeight).toBe(600);
    expect(style.textAlign).toBe("justify");
    expect(String(style.fontFamily)).toContain("--font-mono");
    expect(WIDTH_REM.narrow < WIDTH_REM.medium && WIDTH_REM.medium < WIDTH_REM.wide).toBe(true);
  });
});
