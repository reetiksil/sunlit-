// src/stores/useBookshelfStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ReadingProgress, ShelfCategory } from "@/types";

interface BookshelfState {
  shelf: Record<string, ShelfCategory>; // bookId -> category
  progress: Record<string, ReadingProgress>; // bookId -> progress
  setShelfCategory: (bookId: string, category: ShelfCategory | null) => void;
  updateProgress: (data: {
    bookId: string;
    bookSlug: string;
    chapterNumber: number;
    totalChapters: number;
    scrollPercentage: number;
  }) => void;
  syncWithServer: () => Promise<void>;
}

let syncTimeout: NodeJS.Timeout | null = null;
function scheduleServerSync(shelf: Record<string, ShelfCategory>, progress: Record<string, ReadingProgress>) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await fetch("/api/user/bookshelf", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelf, progress }),
      });
    } catch {}
  }, 1000);
}

export const useBookshelfStore = create<BookshelfState>()(
  persist(
    (set, get) => ({
      shelf: {
        "book-1": "reading",
        "book-2": "completed",
        "book-3": "plan-to-read",
      },
      progress: {
        "book-1": {
          bookId: "book-1",
          bookSlug: "the-lantern-by-the-hill",
          lastChapter: 3,
          totalChapters: 12,
          scrollPercentage: 45,
          readChapters: [1, 2, 3],
          updatedAt: new Date().toISOString(),
        },
      },
      syncWithServer: async () => {
        try {
          const res = await fetch("/api/user/bookshelf");
          if (res.ok) {
            const data = await res.json();
            if (data && (Object.keys(data.shelf || {}).length > 0 || Object.keys(data.progress || {}).length > 0)) {
              set((state) => ({
                shelf: { ...state.shelf, ...data.shelf },
                progress: { ...state.progress, ...data.progress },
              }));
            }
          }
        } catch {}
      },
      setShelfCategory: (bookId, category) =>
        set((state) => {
          const next = { ...state.shelf };
          if (!category) delete next[bookId];
          else next[bookId] = category;
          scheduleServerSync(next, state.progress);
          return { shelf: next };
        }),
      updateProgress: ({ bookId, bookSlug, chapterNumber, totalChapters, scrollPercentage }) =>
        set((state) => {
          const existing = state.progress[bookId];
          const readSet = new Set(existing?.readChapters ?? []);
          readSet.add(chapterNumber);

          const nextShelf = {
            ...state.shelf,
            [bookId]: state.shelf[bookId] ?? "reading",
          };
          const nextProgress = {
            ...state.progress,
            [bookId]: {
              bookId,
              bookSlug,
              lastChapter: chapterNumber,
              totalChapters,
              scrollPercentage,
              readChapters: Array.from(readSet),
              updatedAt: new Date().toISOString(),
            },
          };

          scheduleServerSync(nextShelf, nextProgress);

          return {
            shelf: nextShelf,
            progress: nextProgress,
          };
        }),
    }),
    {
      name: "sunlit-bookshelf-store",
    }
  )
);
