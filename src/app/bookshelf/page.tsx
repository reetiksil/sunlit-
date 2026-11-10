"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { LayoutGrid, List, BookHeart, UploadCloud } from "lucide-react";
import { getAllBooks } from "@/services/api";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { BookCard } from "@/components/book/BookCard";
import { SvgCover } from "@/components/book/SvgCover";
import { db } from "@/lib/db";
import { ShelfCategory } from "@/types";

export default function BookshelfPage() {
  const { shelf, progress } = useBookshelfStore();
  const { data: books = [] } = useQuery({ queryKey: ["books-all"], queryFn: getAllBooks });
  const uploadedBooks = useLiveQuery(() => db.uploadedBooks.toArray(), []) ?? [];

  const [activeTab, setActiveTab] = useState<ShelfCategory | "uploaded">("reading");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const booksInTab = books.filter((b) => shelf[b.id] === activeTab);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-fluid-h1 font-semibold">My Sanctuary Bookshelf</h1>
          <p className="text-sm text-text-muted">
            Your saved stories, reading progress, and locally uploaded books.
          </p>
        </div>

        {/* Grid / List Toggle */}
        <div className="flex items-center rounded-full border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            className={`rounded-full p-2 ${
              viewMode === "grid" ? "bg-primary text-primary-fg" : "text-text-muted"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            className={`rounded-full p-2 ${
              viewMode === "list" ? "bg-primary text-primary-fg" : "text-text-muted"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Shelf Category Tabs */}
      <div
        role="tablist"
        aria-label="Bookshelf categories"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {(
          [
            { id: "reading", label: "Reading" },
            { id: "plan-to-read", label: "Plan to Read" },
            { id: "completed", label: "Completed" },
            { id: "uploaded", label: `Uploaded (${uploadedBooks.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === t.id
                ? "bg-primary text-primary-fg"
                : "bg-surface-soft/70 text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "uploaded" ? (
        uploadedBooks.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-14 text-center space-y-4 shadow-calm">
            <UploadCloud className="mx-auto h-10 w-10 text-primary" />
            <h2 className="font-serif text-xl font-semibold">No uploaded books yet</h2>
            <p className="mx-auto max-w-md text-sm text-text-muted">
              Add personal EPUB or PDF files to read them inside our calm typography engine.
            </p>
            <Link
              href="/read-your-own"
              className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-xs font-semibold text-primary-fg"
            >
              Upload a Book
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uploadedBooks.map((ub) => (
              <Link
                key={ub.id}
                href="/read-your-own"
                className="rounded-2xl border border-border bg-surface p-5 shadow-calm hover:-translate-y-1"
              >
                <span className="rounded-md bg-surface-soft px-2 py-0.5 text-[11px] font-semibold uppercase">
                  {ub.format}
                </span>
                <h3 className="mt-2 font-serif text-lg font-semibold">{ub.title}</h3>
                <p className="text-xs text-text-muted">Stored locally in browser IndexedDB</p>
              </Link>
            ))}
          </div>
        )
      ) : booksInTab.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-14 text-center space-y-4 shadow-calm">
          <BookHeart className="mx-auto h-10 w-10 text-primary" />
          <h2 className="font-serif text-xl font-semibold">This shelf is quiet right now</h2>
          <p className="mx-auto max-w-md text-sm text-text-muted">
            Explore our collection to add stories to your {activeTab.replace("-", " ")} list.
          </p>
          <Link
            href="/browse"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-xs font-semibold text-primary-fg"
          >
            Browse Catalog
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {booksInTab.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {booksInTab.map((book) => {
            const prog = progress[book.id];
            return (
              <Link
                key={book.id}
                href={`/book/${book.slug}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-calm hover:bg-surface-soft"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 shrink-0">
                    <SvgCover
                      title={book.title}
                      author={book.author}
                      styleConfig={book.coverStyle}
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-text">{book.title}</h3>
                    <p className="text-xs text-text-muted">{book.author}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {prog
                        ? `Last read Chapter ${prog.lastChapter} of ${book.chapterCount}`
                        : `${book.chapterCount} chapters`}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-fg">
                  Open
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}