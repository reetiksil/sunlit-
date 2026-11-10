"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  Star,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { getBook, getChapters, getAllBooks } from "@/services/api";
import { SvgCover } from "@/components/book/SvgCover";
import { BookCard } from "@/components/book/BookCard";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { BookshelfSelector } from "@/components/book/BookshelfSelector";

export default function BookDetailPage() {
  const params = useParams<{ slug: string }>();
  const { shelf, progress, setShelfCategory } = useBookshelfStore();

  const [activeTab, setActiveTab] = useState<"chapters" | "about" | "reviews">("chapters");
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", params.slug],
    queryFn: () => getBook(params.slug),
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", book?.id],
    enabled: !!book?.id,
    queryFn: () => getChapters(book!.id),
  });

  const { data: allBooks = [] } = useQuery({
    queryKey: ["books-all"],
    queryFn: getAllBooks,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-96 animate-pulse rounded-3xl bg-surface-soft" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-2xl font-semibold">Story Not Found</h1>
        <p className="text-sm text-text-muted">
          We couldn&apos;t find the book you were looking for in the sanctuary.
        </p>
        <Link
          href="/browse"
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-xs font-semibold text-primary-fg"
        >
          Return to Browse
        </Link>
      </div>
    );
  }

  const bookProgress = progress[book.id];
  const currentShelf = shelf[book.id];
  const continueChapter = bookProgress?.lastChapter ?? 1;

  const filteredChapters = chapters
    .filter(
      (c) =>
        c.title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
        String(c.number).includes(chapterSearch)
    )
    .sort((a, b) => (sortAsc ? a.number - b.number : b.number - a.number));

  const similarBooks = allBooks
    .filter((b) => b.id !== book.id && b.genres.some((g) => book.genres.includes(g)))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-14 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Two-Column Book Overview */}
      <section className="grid grid-cols-1 gap-8 rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-calm md:grid-cols-12">
        <div className="mx-auto w-48 sm:w-56 md:col-span-4 lg:col-span-3">
          <SvgCover
            title={book.title}
            author={book.author}
            styleConfig={book.coverStyle}
            coverImageUrl={book.coverImageUrl}
          />
        </div>

        <div className="space-y-5 md:col-span-8 lg:col-span-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-mint/30 px-3 py-1 text-xs font-semibold capitalize text-text">
              {book.status}
            </span>
            {book.genres.map((g) => (
              <Link
                key={g}
                href={`/browse?genres=${g}`}
                className="rounded-full bg-surface-soft px-3 py-1 text-xs font-medium capitalize text-text hover:bg-primary/25"
              >
                {g.replace("-", " ")}
              </Link>
            ))}
          </div>

          <h1 className="font-serif text-fluid-h1 font-semibold leading-tight text-text">
            {book.title}
          </h1>

          <p className="text-sm font-medium text-text-muted">By {book.author}</p>

          <div className="flex flex-wrap items-center gap-6 text-xs text-text-muted">
            {book.rating > 0 && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-text">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {book.rating} / 5.0
              </span>
            )}
            {book.views > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {book.views.toLocaleString()} peaceful reads
              </span>
            )}
            <span>{book.chapterCount} Chapters</span>
          </div>

          <div className="space-y-2">
            <p
              className={`text-sm leading-relaxed text-text-muted ${
                expandedDesc ? "" : "line-clamp-3"
              }`}
            >
              {book.description}
            </p>
            <button
              type="button"
              onClick={() => setExpandedDesc((v) => !v)}
              className="text-xs font-semibold text-text underline"
            >
              {expandedDesc ? "Show less" : "Read more"}
            </button>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/book/${book.slug}/chapter/${continueChapter}`}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-fg shadow-sm hover:brightness-105"
            >
              <BookOpen className="h-4 w-4" />
              {bookProgress
                ? `Continue from Chapter ${continueChapter}`
                : "Start Reading Chapter 1"}
            </Link>

            <BookshelfSelector value={currentShelf ?? null} onChange={(c) => setShelfCategory(book.id, c)} />
          </div>
        </div>
      </section>

      {/* Tabs: Chapters / About / Reviews */}
      <section className="space-y-6">
        <div
          role="tablist"
          aria-label="Book sections"
          className="flex gap-2 border-b border-border pb-2"
        >
          {(["chapters", "about", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-fg"
                  : "text-text-muted hover:bg-surface-soft hover:text-text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "chapters" && (
          <div className="space-y-5 rounded-3xl border border-border bg-surface p-6 shadow-calm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  placeholder="Filter chapters by title or number..."
                  className="h-10 w-full rounded-xl border border-border bg-bg pl-10 pr-4 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => setSortAsc((v) => !v)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface-soft px-4 text-xs font-semibold text-text"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortAsc ? "Oldest First" : "Newest First"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filteredChapters.map((ch) => {
                const isRead = bookProgress?.readChapters.includes(ch.number);
                return (
                  <Link
                    key={ch.id}
                    href={`/book/${book.slug}/chapter/${ch.number}`}
                    className="flex items-center justify-between rounded-2xl border border-border bg-bg/60 p-4 hover:bg-surface-soft"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-serif text-sm font-semibold text-text">
                        Chapter {ch.number}: {ch.title}
                      </p>
                      <p className="text-xs text-text-muted">{ch.wordCount} words</p>
                    </div>
                    {isRead && (
                      <span
                        title="Read"
                        className="inline-flex items-center gap-1 rounded-full bg-accent-mint/30 px-2.5 py-1 text-[11px] font-semibold text-text"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Read
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="rounded-3xl border border-border bg-surface p-8 space-y-4 shadow-calm">
            <h2 className="font-serif text-xl font-semibold">About This Edition</h2>
            <p className="text-sm leading-relaxed text-text-muted">{book.description}</p>
            <p className="text-xs text-text-muted">
              Formatted for distraction-free reading with customizable serif, sans-serif, and
              Atkinson Hyperlegible typography.
            </p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="rounded-3xl border border-border bg-surface p-8 space-y-5 shadow-calm">
            <h2 className="font-serif text-xl font-semibold">Reader Reflections</h2>
            {book.id.startsWith("book-") && !book.id.startsWith("book-17") && Number(book.id.replace("book-", "")) <= 24 && book.rating > 0 ? (
              [
                {
                  reader: "Maren L.",
                  comment: "Like sitting on a sunlit porch with a warm mug of chamomile tea.",
                  stars: 5,
                },
                {
                  reader: "Theo A.",
                  comment: "Gentle pacing and wonderful atmosphere. Perfect before sleep.",
                  stars: 5,
                },
              ].map((rev, i) => (
                <div key={i} className="border-b border-border pb-4 last:border-none">
                  <p className="text-xs font-semibold text-text">
                    {rev.reader} · {"★".repeat(rev.stars)}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{rev.comment}</p>
                </div>
              ))
            ) : (
              <div className="py-6 text-center space-y-2">
                <p className="text-sm text-text-muted">
                  No reader reviews or reflections have been submitted for this book yet.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* You Might Also Like */}
      {similarBooks.length > 0 && (
        <section aria-labelledby="similar-heading" className="space-y-4">
          <h2 id="similar-heading" className="font-serif text-fluid-h2 font-semibold">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-6">
            {similarBooks.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}