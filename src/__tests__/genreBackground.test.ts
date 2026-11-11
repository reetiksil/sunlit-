import { describe, it, expect } from "vitest";
import { detectGenrePreset } from "@/components/reader/ReaderGenreBackground";
import { sanitizeSettings, DEFAULT_READER_SETTINGS } from "@/lib/readerStyle";

describe("Genre-Aware Background Preset Matching", () => {
  it("correctly matches Fantasy genres", () => {
    expect(detectGenrePreset(["fantasy"])).toBe("fantasy");
    expect(detectGenrePreset(["high-fantasy", "adventure"])).toBe("fantasy");
    expect(detectGenrePreset(["magic", "cozy"])).toBe("fantasy");
  });

  it("correctly matches Romance genres", () => {
    expect(detectGenrePreset(["romance"])).toBe("romance");
    expect(detectGenrePreset(["romantic-comedy"])).toBe("romance");
    expect(detectGenrePreset(["love-story"])).toBe("romance");
  });

  it("correctly matches Mystery & Thriller genres", () => {
    expect(detectGenrePreset(["mystery"])).toBe("mystery");
    expect(detectGenrePreset(["detective", "crime"])).toBe("mystery");
    expect(detectGenrePreset(["thriller", "suspense"])).toBe("mystery");
    expect(detectGenrePreset(["noir"])).toBe("mystery");
  });

  it("correctly matches Science Fiction genres", () => {
    expect(detectGenrePreset(["sci-fi"])).toBe("sci-fi");
    expect(detectGenrePreset(["space-opera"])).toBe("sci-fi");
    expect(detectGenrePreset(["cyberpunk"])).toBe("sci-fi");
  });

  it("correctly matches Literary Fiction / Slice of Life genres", () => {
    expect(detectGenrePreset(["slice-of-life"])).toBe("slice-of-life");
    expect(detectGenrePreset(["cozy"])).toBe("slice-of-life");
    expect(detectGenrePreset(["contemporary", "drama"])).toBe("slice-of-life");
  });

  it("correctly matches Horror / Gothic genres", () => {
    expect(detectGenrePreset(["horror"])).toBe("horror");
    expect(detectGenrePreset(["gothic", "dark"])).toBe("horror");
    expect(detectGenrePreset(["supernatural", "terror"])).toBe("horror");
  });

  it("correctly matches Poetry & Philosophy genres", () => {
    expect(detectGenrePreset(["poetry"])).toBe("poetry");
    expect(detectGenrePreset(["philosophy"])).toBe("poetry");
    expect(detectGenrePreset(["philosophical-essays"])).toBe("poetry");
  });

  it("correctly matches Children's Fiction & Fairy Tales", () => {
    expect(detectGenrePreset(["children"])).toBe("children");
    expect(detectGenrePreset(["fairy-tales"])).toBe("children");
    expect(detectGenrePreset(["fable", "kids"])).toBe("children");
  });

  it("correctly matches Historical Fiction genres", () => {
    expect(detectGenrePreset(["historical"])).toBe("historical");
    expect(detectGenrePreset(["history", "period"])).toBe("historical");
    expect(detectGenrePreset(["classic", "victorian"])).toBe("historical");
  });

  it("falls back cleanly to neutral for unknown or empty genres", () => {
    expect(detectGenrePreset([])).toBe("neutral");
    expect(detectGenrePreset(["cooking", "textbook"])).toBe("neutral");
  });

  it("handles animationIntensity settings and sanitization", () => {
    expect(DEFAULT_READER_SETTINGS.animationIntensity).toBe("ambient");
    const subtle = sanitizeSettings({ animationIntensity: "subtle" });
    expect(subtle.animationIntensity).toBe("subtle");
    const off = sanitizeSettings({ animationIntensity: "off" });
    expect(off.animationIntensity).toBe("off");
    const invalid = sanitizeSettings({ animationIntensity: "extreme" as never });
    expect(invalid.animationIntensity).toBe("ambient");
  });
});
