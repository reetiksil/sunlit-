import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ReaderSettings } from "@/types";
import { DEFAULT_READER_SETTINGS, sanitizeSettings } from "@/lib/readerStyle";

export { DEFAULT_READER_SETTINGS };

interface ReaderStoreState {
  settings: ReaderSettings;
  updateSettings: (partial: Partial<ReaderSettings>) => void;
  toggleReaderMode: () => void;
  resetSettings: () => void;
}

export const useReaderStore = create<ReaderStoreState>()(
  persist(
    (set) => ({
      settings: DEFAULT_READER_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({ settings: sanitizeSettings({ ...state.settings, ...partial }) })),
      toggleReaderMode: () =>
        set((state) => ({ settings: { ...state.settings, readerMode: !state.settings.readerMode } })),
      resetSettings: () => set((state) => ({ settings: { ...DEFAULT_READER_SETTINGS, readerMode: state.settings.readerMode } })),
    }),
    {
      name: "sunlit-reader-settings",
      version: 2,
      // Old versions stored a partial/unvalidated object; re-validate whatever is on disk.
      migrate: (persisted) => {
        const old = persisted as { settings?: Partial<ReaderSettings> } | undefined;
        return { settings: sanitizeSettings(old?.settings) } as Partial<ReaderStoreState>;
      },
      merge: (persisted, current) => ({
        ...current,
        settings: sanitizeSettings((persisted as { settings?: Partial<ReaderSettings> } | undefined)?.settings),
      }),
    }
  )
);
