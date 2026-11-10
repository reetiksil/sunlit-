import { describe, it, expect, beforeEach } from "vitest";
import { useReaderStore, DEFAULT_READER_SETTINGS } from "@/stores/useReaderStore";

describe("Reader Settings Store", () => {
  beforeEach(() => {
    useReaderStore.getState().resetSettings();
  });

  it("initializes with calm default settings", () => {
    const { settings } = useReaderStore.getState();
    expect(settings.fontSize).toBe(19);
    expect(settings.fontFamily).toBe("serif");
    expect(settings.theme).toBe("day");
  });

  it("updates font size, family, and reading theme independently", () => {
    useReaderStore.getState().updateSettings({
      fontSize: 24,
      fontFamily: "dyslexic",
      theme: "sepia",
    });

    const { settings } = useReaderStore.getState();
    expect(settings.fontSize).toBe(24);
    expect(settings.fontFamily).toBe("dyslexic");
    expect(settings.theme).toBe("sepia");
  });

  it("resets back to default settings", () => {
    useReaderStore.getState().updateSettings({ fontSize: 30, theme: "true-dark" });
    useReaderStore.getState().resetSettings();
    expect(useReaderStore.getState().settings).toEqual(DEFAULT_READER_SETTINGS);
  });
});