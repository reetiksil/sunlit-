"use client";

import React from "react";
import Link from "next/link";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { useQuery } from "@tanstack/react-query";
import { getAllBooks } from "@/services/api";
import { Bookmark, BookOpen, Compass } from "lucide-react";

export function ContinueReadingShelf() {
  const progressMap = useBookshelfStore((s) => s.progress);
  const { data: books = [] } = useQuery({
    queryKey: ["books-all"],
    queryFn: getAllBooks,
  });

  const activeProgressList = Object.values(progressMap)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  if (!activeProgressList.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-lg font-bold tracking-tight">Continue Your Journey</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeProgressList.map((prog) => {
          const book = books.find((b) => b.id === prog.bookId || b.slug === prog.bookSlug);
          if (!book) return null;

          const pct = Math.round((prog.lastChapter / Math.max(prog.totalChapters, 1)) * 100);

          return (
            <div
              key={prog.bookId}
              className="card p-4 border border-primary/20 bg-gradient-to-r from-surface to-surface-soft/40 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-serif font-bold text-sm text-text truncate">{book.title}</p>
                <p className="text-xs text-text-muted">
                  Chapter {prog.lastChapter} of {prog.totalChapters || book.chapterCount}
                </p>
                <div className="w-32 bg-border/80 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <Link
                href={`/book/${book.slug}/chapter/${prog.lastChapter}`}
                className="btn btn-primary btn-sm flex-shrink-0 text-xs shadow-xs"
              >
                Resume
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
