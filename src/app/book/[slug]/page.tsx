"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  Star,
  ArrowUpDown,
  Search,
  Edit3,
  Trash2,
  Send,
  MessageSquarePlus,
  Clock,
  Languages,
  FileText,
  CalendarDays,
  User as UserIcon,
  Lock,
} from "lucide-react";
import {
  getBook,
  getChapters,
  getAllBooks,
  getGenres,
  getReviews,
  postReview,
  deleteReview,
  recordBookView,
} from "@/services/api";
import { SvgCover } from "@/components/book/SvgCover";
import { BookCard } from "@/components/book/BookCard";
import { useBookshelfStore } from "@/stores/useBookshelfStore";
import { BookshelfSelector } from "@/components/book/BookshelfSelector";
import { useAuthStore } from "@/stores/useAuthStore";
import { Review } from "@/types";

export default function BookDetailPage() {
  const params = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { shelf, progress, setShelfCategory } = useBookshelfStore();

  const [activeTab, setActiveTab] = useState<"chapters" | "about" | "reviews">("chapters");
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // Review form state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", params.slug],
    queryFn: () => getBook(params.slug),
  });

  // Track book views even for guests (IP tracked server-side)
  useEffect(() => {
    if (book?.id) {
      recordBookView(book.id).catch(() => {});
    }
  }, [book?.id]);

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", book?.id],
    enabled: !!book?.id,
    queryFn: () => getChapters(book!.id),
  });

  const { data: allBooks = [] } = useQuery({
    queryKey: ["books-all"],
    queryFn: getAllBooks,
  });

  const { data: allGenres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", book?.id],
    enabled: !!book?.id,
    queryFn: () => getReviews(book!.id),
  });

  const userExistingReview = reviews.find((r) => user && (r.userId === user.id || r.userEmail === user.email));

  const handleStartEditReview = (r: Review) => {
    setEditingReviewId(r.id);
    setReviewRating(r.rating);
    setReviewTitle(r.title ?? "");
    setReviewContent(r.content);
    setReviewError(null);
    setReviewSuccess(null);
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setReviewRating(5);
    setReviewTitle("");
    setReviewContent("");
    setReviewError(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    if (!user) {
      setReviewError("Please sign in to write a review.");
      return;
    }
    if (!reviewContent.trim()) {
      setReviewError("Please provide some thoughts for your reflection.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);
    try {
      await postReview(book.id, {
        id: editingReviewId ?? undefined,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        content: reviewContent.trim(),
      });
      setReviewSuccess(editingReviewId ? "Your reflection has been updated." : "Thank you for sharing your reflection!");
      setEditingReviewId(null);
      setReviewTitle("");
      setReviewContent("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["reviews", book.id] });
      queryClient.invalidateQueries({ queryKey: ["book", params.slug] });
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to post review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!book) return;
    if (!confirm("Are you sure you want to remove your reflection?")) return;
    try {
      await deleteReview(book.id, reviewId);
      queryClient.invalidateQueries({ queryKey: ["reviews", book.id] });
      queryClient.invalidateQueries({ queryKey: ["book", params.slug] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete review");
    }
  };

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
  const firstChapterNumber = chapters.length > 0 ? chapters[0].number : 1;
  const continueChapter = bookProgress?.lastChapter ?? firstChapterNumber;

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

          <p className="text-sm font-medium text-text-muted">
            By{" "}
            <Link
              href={`/browse?author=${encodeURIComponent(book.author)}`}
              className="font-serif font-semibold text-text hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {book.author}
            </Link>
          </p>

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
              className={`text-sm leading-relaxed text-text-muted whitespace-pre-line ${
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
                : `Start Reading Chapter ${firstChapterNumber}`}
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

        {activeTab === "about" && (() => {
          const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
          const avgWordsPerChapter = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;
          const totalMinutes = totalWords > 0
            ? Math.max(1, Math.round(totalWords / 220))
            : Math.max(1, (book.chapterCount || 1) * 7);
          const readTimeLabel =
            totalMinutes >= 60
              ? `~${Math.floor(totalMinutes / 60)} hr ${totalMinutes % 60 > 0 ? `${totalMinutes % 60} min` : ""}`.trim()
              : `~${totalMinutes} min`;
          const authorBooks = allBooks.filter(
            (b) => b.author.toLowerCase() === book.author.toLowerCase()
          );
          const matchedGenres = book.genres.map((slug) => ({
            slug,
            meta: allGenres.find((g) => g.slug === slug),
          }));

          return (
            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-calm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-text">Book Information</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Publication details, word length, and reader pacing for this work.
                  </p>
                </div>
                <span className="rounded-full bg-accent-mint/30 px-3 py-1 text-xs font-semibold capitalize text-text">
                  Status: {book.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-surface-soft/60 p-4 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-primary" /> Original Language
                  </span>
                  <p className="text-sm font-semibold capitalize text-text">{book.language || "English"}</p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-soft/60 p-4 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Estimated Read Time
                  </span>
                  <p className="text-sm font-semibold text-text">{readTimeLabel}</p>
                  <p className="text-[11px] text-text-muted">At ~220 words/min</p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-soft/60 p-4 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Length & Chapters
                  </span>
                  <p className="text-sm font-semibold text-text">
                    {totalWords > 0 ? `${totalWords.toLocaleString()} words` : `${book.chapterCount} chapters`}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {book.chapterCount} {book.chapterCount === 1 ? "chapter" : "chapters"}
                    {avgWordsPerChapter > 0 ? ` · ~${avgWordsPerChapter.toLocaleString()} words/ch` : ""}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-soft/60 p-4 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> Release Timeline
                  </span>
                  <p className="text-sm font-semibold text-text">
                    Updated{" "}
                    {new Date(book.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Added{" "}
                    {new Date(book.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-bg/50 p-5 space-y-3">
                  <h3 className="font-serif text-sm font-semibold text-text flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" /> Author Catalog
                  </h3>
                  <p className="text-xs leading-relaxed text-text-muted">
                    Written by <strong className="text-text">{book.author}</strong>.{" "}
                    {authorBooks.length > 1
                      ? `${authorBooks.length} works by this author are available in the library.`
                      : "This is currently their featured title in the library."}
                  </p>
                  <Link
                    href={`/browse?author=${encodeURIComponent(book.author)}`}
                    className="inline-flex items-center text-xs font-semibold text-primary hover:underline"
                  >
                    Browse all works by {book.author} →
                  </Link>
                </div>

                <div className="rounded-2xl border border-border bg-bg/50 p-5 space-y-3">
                  <h3 className="font-serif text-sm font-semibold text-text">Genres & Story Tags</h3>
                  <div className="space-y-2">
                    {matchedGenres.map(({ slug, meta }) => (
                      <div key={slug} className="flex items-start justify-between gap-3 text-xs">
                        <Link
                          href={`/browse?genres=${encodeURIComponent(slug)}`}
                          className="shrink-0 rounded-full bg-surface-soft px-2.5 py-0.5 font-semibold capitalize text-text hover:bg-primary/25"
                        >
                          {meta?.name || slug.replace("-", " ")}
                        </Link>
                        {meta?.description && (
                          <span className="text-text-muted text-right line-clamp-1">{meta.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === "reviews" && (
          <div className="rounded-3xl border border-border bg-surface p-8 space-y-8 shadow-calm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
              <div>
                <h2 className="font-serif text-xl font-semibold text-text">Reader Reflections & Reviews</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Share your impressions, favorite passages, and peaceful thoughts with fellow readers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center text-amber-500 font-bold text-sm">
                  <Star className="h-4 w-4 fill-amber-500 mr-1" />
                  {book.rating > 0 ? book.rating.toFixed(1) : "New"}
                </span>
                <span className="text-xs text-text-muted">
                  ({reviews.length} {reviews.length === 1 ? "reflection" : "reflections"})
                </span>
              </div>
            </div>

            {/* Write / Edit Review Form (One review per reader; existing review can be edited) */}
            {user ? (
              userExistingReview && !editingReviewId ? (
                <div className="rounded-2xl border border-border bg-surface-soft/50 p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-sm font-bold text-text flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      You have already reviewed this book
                    </h3>
                    <p className="text-xs text-text-muted">
                      Each reader can submit one review per book. You can update or remove your existing review below.
                    </p>
                    {reviewSuccess && (
                      <p className="mt-2 text-xs font-medium text-primary">{reviewSuccess}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-muted opacity-60 cursor-not-allowed"
                    >
                      <Lock className="h-3.5 w-3.5" /> Review Submitted
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditReview(userExistingReview)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-fg shadow-sm hover:brightness-105"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit Your Review
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="rounded-2xl border border-border bg-surface-soft/40 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-sm font-bold text-text flex items-center gap-2">
                      <MessageSquarePlus className="h-4 w-4 text-primary" />
                      {editingReviewId ? "Edit Your Reflection" : "Write a Reflection"}
                    </h3>
                    {editingReviewId && (
                      <button
                        type="button"
                        onClick={handleCancelEditReview}
                        className="text-xs text-text-muted hover:text-text underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                {reviewError && (
                  <p className="rounded-xl bg-danger/10 border border-danger/20 p-3 text-xs text-danger font-medium">
                    {reviewError}
                  </p>
                )}
                {reviewSuccess && (
                  <p className="rounded-xl bg-accent-mint/20 border border-accent-mint/30 p-3 text-xs text-text font-medium">
                    {reviewSuccess}
                  </p>
                )}

                {/* Star rating selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-muted">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                        aria-label={`${star} star`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            (reviewHoverRating || reviewRating) >= star
                              ? "fill-amber-400 text-amber-400"
                              : "text-text-muted/40"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-text ml-2">
                    {reviewHoverRating || reviewRating} / 5
                  </span>
                </div>

                <div>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Headline or summary (optional)"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
                    maxLength={100}
                  />
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="What did you feel while reading? What gentle beauty did you find in these pages?"
                    className="w-full rounded-xl border border-border bg-surface p-4 text-xs text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none resize-y"
                    required
                  />
                </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingReview || !reviewContent.trim()}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-fg shadow-sm hover:brightness-105 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isSubmittingReview ? "Saving…" : editingReviewId ? "Update Reflection" : "Publish Reflection"}
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface-soft/30 p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-text">Have you enjoyed this story?</p>
                <p className="text-xs text-text-muted">
                  Sign in to your account to leave a reflection, rate chapters, and share your quiet reading moments.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(`/book/${book.slug}`)}`}
                  className="inline-block mt-2 rounded-full bg-primary/20 px-5 py-2 text-xs font-semibold text-text hover:bg-primary/30"
                >
                  Sign In to Review
                </Link>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="font-serif text-base font-semibold text-text">No reflections yet</p>
                  <p className="text-xs text-text-muted">
                    Be the first peaceful reader to share your impression of this story.
                  </p>
                </div>
              ) : (
                reviews.map((r) => {
                  const isOwner = user && (r.userId === user.id || r.userEmail === user.email);
                  const canManage = isOwner || user?.role === "admin";
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-border bg-bg/40 p-5 space-y-2.5 hover:border-border/80 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-text">{r.userName || "Quiet Reader"}</span>
                          <span className="text-[11px] text-text-muted">·</span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < r.rating ? "fill-amber-400 text-amber-400" : "text-border"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-text-muted">
                            {new Date(r.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          {canManage && (
                            <div className="flex items-center gap-1.5 ml-2">
                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditReview(r)}
                                  className="text-xs text-text-muted hover:text-text p-1 rounded hover:bg-surface-soft"
                                  title="Edit your reflection"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(r.id)}
                                className="text-xs text-danger hover:text-danger/80 p-1 rounded hover:bg-danger/10"
                                title="Delete reflection"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {r.title && (
                        <h4 className="font-serif text-sm font-bold text-text">{r.title}</h4>
                      )}

                      <p className="text-xs leading-relaxed text-text whitespace-pre-line">{r.content}</p>
                    </div>
                  );
                })
              )}
            </div>
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