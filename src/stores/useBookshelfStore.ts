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
}

export const useBookshelfStore = create<BookshelfState>()(
  persist(
    (set) => ({
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
      setShelfCategory: (bookId, category) =>
        set((state) => {
          const next = { ...state.shelf };
          if (!category) delete next[bookId];
          else next[bookId] = category;
          return { shelf: next };
        }),
      updateProgress: ({ bookId, bookSlug, chapterNumber, totalChapters, scrollPercentage }) =>
        set((state) => {
          const existing = state.progress[bookId];
          const readSet = new Set(existing?.readChapters ?? []);
          readSet.add(chapterNumber);

          return {
            shelf: {
              ...state.shelf,
              [bookId]: state.shelf[bookId] ?? "reading",
            },
            progress: {
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
            },
          };
        }),
    }),
    {
      name: "sunlit-bookshelf-store",
    }
  )
);