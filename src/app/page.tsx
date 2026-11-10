"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { getAllBooks, getGenres } from "@/services/api";
import { SvgCover } from "@/components/book/SvgCover";
import { BookCard } from "@/components/book/BookCard";
import { useBookshelfStore } from "@/stores/useBookshelfStore";

export default function HomePage() {
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books-all"],
    queryFn: getAllBooks,
  });

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const { progress, shelf, setShelfCategory } = useBookshelfStore();

  const featuredBooks = books.filter((b) => b.featured).slice(0, 4);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || featuredBooks.length === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % featuredBooks.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, featuredBooks.length]);

  const continueReadingItems = Object.values(progress)
    .map((p) => ({
      progress: p,
      book: books.find((b) => b.id === p.bookId),
    }))
    .filter((item) => item.book !== undefined);

  const popularBooks = books
    .filter((b) => b.weeklyRank !== undefined)
    .sort((a, b) => (a.weeklyRank ?? 99) - (b.weeklyRank ?? 99));

  const completedBooks = books.filter((b) => b.status === "completed").slice(0, 6);
  const newArrivals = [...books]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. Calm Featured Hero Carousel */}
      <section
        aria-roledescription="carousel"
        aria-label="Featured Books"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-calm"
      >
        {isLoading || featuredBooks.length === 0 ? (
          <div className="h-80 animate-pulse rounded-2xl bg-surface-soft" />
        ) : (
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="mx-auto w-44 sm:w-56 md:col-span-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredBooks[activeSlide].id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  <SvgCover
                    title={featuredBooks[activeSlide].title}
                    author={featuredBooks[activeSlide].author}
                    styleConfig={featuredBooks[activeSlide].coverStyle}
                    coverImageUrl={featuredBooks[activeSlide].coverImageUrl}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="space-y-5 text-center md:col-span-8 md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1 text-xs font-medium text-text">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Featured Sanctuary Pick
                </span>
                {featuredBooks[activeSlide].genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-accent-sky/20 px-3 py-1 text-xs font-medium capitalize text-text"
                  >
                    {g.replace("-", " ")}
                  </span>
                ))}
              </div>

              <h1 className="font-serif text-fluid-h1 font-semibold leading-tight text-text">
                {featuredBooks[activeSlide].title}
              </h1>

              <p className="text-sm font-medium text-text-muted">
                By {featuredBooks[activeSlide].author} · {featuredBooks[activeSlide].chapterCount}{" "}
                Chapters
              </p>

              <p className="max-w-2xl text-base leading-relaxed text-text-muted">
                {featuredBooks[activeSlide].blurb}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 md:justify-start">
                <Link
                  href={`/book/${featuredBooks[activeSlide].slug}/chapter/1`}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-fg shadow-sm hover:brightness-105 active:scale-[0.98]"
                >
                  <BookOpen className="h-4 w-4" />
                  Start Reading
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const id = featuredBooks[activeSlide].id;
                    setShelfCategory(id, shelf[id] ? null : "plan-to-read");
                  }}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface-soft px-5 text-sm font-medium text-text hover:bg-primary/20"
                >
                  {shelf[featuredBooks[activeSlide].id] ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      On Bookshelf
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-4 w-4" />
                      Add to Shelf
                    </>
                  )}
                </button>
              </div>

              {/* Carousel Dots & Arrows */}
              <div className="flex items-center justify-center gap-3 pt-4 md:justify-start">
                <button
                  type="button"
                  onClick={() =>
                    setActiveSlide(
                      (prev) => (prev - 1 + featuredBooks.length) % featuredBooks.length
                    )
                  }
                  aria-label="Previous featured book"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-soft"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2" role="tablist" aria-label="Slide controls">
                  {featuredBooks.map((b, idx) => (
                    <button
                      key={b.id}
                      type="button"
                      role="tab"
                      aria-selected={activeSlide === idx}
                      aria-label={`Slide ${idx + 1}: ${b.title}`}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        activeSlide === idx ? "w-8 bg-primary" : "w-2.5 bg-border"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev + 1) % featuredBooks.length)}
                  aria-label="Next featured book"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-soft"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Continue Reading Row */}
      {continueReadingItems.length > 0 && (
        <section aria-labelledby="continue-reading-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="continue-reading-heading" className="font-serif text-fluid-h2 font-semibold">
              Continue Reading
            </h2>
            <Link href="/bookshelf" className="text-sm font-medium text-text-muted hover:text-text">
              View Bookshelf →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {continueReadingItems.map(({ book, progress: prog }) =>
              book ? (
                <Link
                  key={book.id}
                  href={`/book/${book.slug}/chapter/${prog.lastChapter}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-calm hover:-translate-y-1"
                >
                  <div className="w-16 shrink-0">
                    <SvgCover
                      title={book.title}
                      author={book.author}
                      styleConfig={book.coverStyle}
                      coverImageUrl={book.coverImageUrl}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="truncate font-serif text-base font-semibold text-text">
                      {book.title}
                    </h3>
                    <p className="text-xs text-text-muted">
                      Chapter {prog.lastChapter} of {prog.totalChapters}
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
                      <div
                        className="h-full rounded-full bg-accent-sky"
                        style={{
                          width: `${Math.round((prog.lastChapter / prog.totalChapters) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* 3. Browse by Genre Chips */}
      <section aria-labelledby="genres-heading" className="space-y-4">
        <h2 id="genres-heading" className="font-serif text-fluid-h2 font-semibold">
          Browse by Mood & Genre
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/browse?genres=${genre.slug}`}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 text-left shadow-calm hover:-translate-y-1 hover:bg-surface-soft"
            >
              <span className="font-serif text-sm font-semibold text-text">{genre.name}</span>
              <span className="mt-1 line-clamp-2 text-xs text-text-muted">{genre.description}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Popular This Week */}
      <section aria-labelledby="popular-heading" className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 id="popular-heading" className="font-serif text-fluid-h2 font-semibold">
            Popular This Week
          </h2>
          <Link href="/browse?sort=popular" className="text-sm font-medium text-text-muted hover:text-text">
            Explore All →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {popularBooks.slice(0, 6).map((book, index) => (
            <BookCard key={book.id} book={book} rank={index + 1} />
          ))}
        </div>
      </section>

      {/* 5. Latest Chapter Updates & Upload Call-to-Action */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section aria-labelledby="updates-heading" className="space-y-4 lg:col-span-8">
          <h2 id="updates-heading" className="font-serif text-fluid-h2 font-semibold">
            Latest Quiet Updates
          </h2>
          <div className="divide-y divide-border rounded-3xl border border-border bg-surface p-2 shadow-calm">
            {books.slice(0, 6).map((book, idx) => (
              <Link
                key={book.id}
                href={`/book/${book.slug}/chapter/${book.chapterCount}`}
                className="flex items-center justify-between gap-4 rounded-2xl p-3.5 hover:bg-surface-soft"
              >
                <div className="min-w-0">
                  <p className="truncate font-serif text-base font-medium text-text">{book.title}</p>
                  <p className="text-xs text-text-muted">
                    Chapter {book.chapterCount} · By {book.author}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-soft px-3 py-1 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />
                  {idx + 1}h ago
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Friendly Upload & Read CTA */}
        <aside className="flex flex-col justify-between rounded-3xl border border-border bg-surface-soft/75 p-7 shadow-calm lg:col-span-4">
          <div className="space-y-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-fg">
              <UploadCloud className="h-6 w-6" />
            </span>
            <h2 className="font-serif text-2xl font-semibold text-text">
              Bring Your Own Books (.epub & .pdf)
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              Enjoy your personal EPUBs and PDFs inside our calm distraction-free reader. Your files
              never leave your device—everything is stored privately in your browser&apos;s IndexedDB.
            </p>
          </div>
          <Link
            href="/read-your-own"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-fg shadow-sm hover:brightness-105"
          >
            Open Personal Reader
          </Link>
        </aside>
      </div>

      {/* 6. Recently Completed & New Arrivals */}
      <section aria-labelledby="completed-heading" className="space-y-5">
        <h2 id="completed-heading" className="font-serif text-fluid-h2 font-semibold">
          Recently Completed Stories
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {completedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}