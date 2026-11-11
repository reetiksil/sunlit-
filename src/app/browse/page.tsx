"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X, BookOpen, Sparkles, BookPlus, RotateCcw, User } from "lucide-react";
import { getBooks, getGenres } from "@/services/api";
import { BookCard } from "@/components/book/BookCard";
import { BookStatus, GenreSlug } from "@/types";
import { RequestBookModal } from "@/components/book/RequestBookModal";
import { ContinueReadingShelf } from "@/components/book/ContinueReadingShelf";
import { CustomSelect } from "@/components/ui/CustomSelect";

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialAuthor = searchParams.get("author") ?? "";
  const initialGenres = (searchParams.get("genres")?.split(",").filter(Boolean) as GenreSlug[]) ?? [];
  const initialStatus = (searchParams.get("status") as BookStatus | "all") ?? "all";
  const initialSort =
    (searchParams.get("sort") as "popular" | "newest" | "rating" | "az") ?? "popular";

  const [query, setQuery] = useState(initialQuery);
  const [author, setAuthor] = useState(initialAuthor);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedGenres, setSelectedGenres] = useState<GenreSlug[]>(initialGenres);
  const [status, setStatus] = useState<BookStatus | "all">(initialStatus);
  const [sort, setSort] = useState<"popular" | "newest" | "rating" | "az">(initialSort);
  const [pageSize, setPageSize] = useState(12);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Sync author if query param changes
  useEffect(() => {
    const currentAuthorParam = searchParams.get("author") ?? "";
    setAuthor(currentAuthorParam);
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Keep filters synchronized in URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (author.trim()) params.set("author", author.trim());
    if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(","));
    if (status !== "all") params.set("status", status);
    if (sort !== "popular") params.set("sort", sort);

    const qs = params.toString();
    router.replace(qs ? `/browse?${qs}` : "/browse", { scroll: false });
  }, [debouncedQuery, author, selectedGenres, status, sort, router]);

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["books-browse", debouncedQuery, author, selectedGenres, status, sort, pageSize],
    queryFn: () =>
      getBooks({
        query: debouncedQuery,
        author: author || undefined,
        genres: selectedGenres,
        status,
        sort,
        page: 1,
        pageSize,
      }),
  });

  const toggleGenre = (slug: GenreSlug) => {
    setSelectedGenres((prev) =>
      prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug]
    );
  };

  const clearAllFilters = () => {
    setQuery("");
    setAuthor("");
    setSelectedGenres([]);
    setStatus("all");
    setSort("popular");
  };

  const hasActiveFilters = Boolean(
    query || author || selectedGenres.length > 0 || status !== "all" || sort !== "popular"
  );

  const FilterControls = () => (
    <div className="space-y-6">
      {/* Royal Genre Selection */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-serif text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            <span>✦</span> Curated Moods & Genres
          </span>
          {selectedGenres.length > 0 && (
            <span className="text-[11px] font-medium text-primary">
              {selectedGenres.length} selected
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => {
            const active = selectedGenres.includes(g.slug);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.slug)}
                className={`group relative rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-fg font-semibold shadow-sm ring-1 ring-primary/60 scale-[1.02]"
                    : "border border-border/70 bg-surface/80 text-text hover:border-primary/40 hover:bg-surface-soft"
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Segment & Sort Dropdown */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2 border-t border-border/50">
        <div className="space-y-2">
          <label className="font-serif text-xs font-semibold uppercase tracking-widest text-text-muted">
            Publication Status
          </label>
          <div className="flex rounded-xl border border-border/80 bg-surface-soft/60 p-1">
            {(["all", "ongoing", "completed"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-all ${
                  status === st
                    ? "bg-surface text-text shadow-xs font-semibold"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="sort-select"
            className="font-serif text-xs font-semibold uppercase tracking-widest text-text-muted"
          >
            Sort Collection
          </label>
          <CustomSelect
            value={sort}
            onChange={(val) => setSort(val as typeof sort)}
            options={[
              { value: "popular", label: "Most Peaceful Reads" },
              { value: "newest", label: "Recently Curated" },
              { value: "rating", label: "Highest Acclaim" },
              { value: "az", label: "Title (A – Z)" },
            ]}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Regal Banner Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
            <Sparkles className="h-4 w-4" />
            <span>The Royal Salon Library</span>
          </div>
          <h1 className="font-serif text-fluid-h1 font-semibold tracking-tight">Explore the Catalog</h1>
          <p className="text-sm text-text-muted max-w-xl">
            A quiet sanctuary for leisurely prose, classic serialized fiction, and community acquisitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRequestModalOpen(true)}
            className="btn btn-ghost btn-sm inline-flex items-center gap-1.5 text-xs font-semibold border-primary/30 hover:border-primary"
          >
            <BookPlus className="h-4 w-4 text-primary" /> Request a Book
          </button>

          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="inline-flex sm:hidden btn btn-primary btn-sm items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters ({selectedGenres.length + (status !== "all" ? 1 : 0)})
          </button>
        </div>
      </div>

      {/* Continue Reading Shelf if active progress exists */}
      <ContinueReadingShelf />

      {/* Redesigned Royal Filter Salon Panel */}
      <div className="card p-6 sm:p-7 border border-primary/25 bg-gradient-to-b from-surface via-surface to-surface-soft/30 shadow-md space-y-6 relative">
        {/* Subtle decorative gold filigree corner accent */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-primary/10 to-transparent" />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by book title, author, or serene motif…"
            aria-label="Search catalog"
            className="h-12 w-full rounded-2xl border border-border/80 bg-bg pl-11 pr-4 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-inner"
          />
        </div>

        {/* Desktop Filter Controls */}
        <div className="hidden sm:block">
          <FilterControls />
        </div>

        {/* Active Author Pill */}
        {author && (
          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <span className="text-xs text-text-muted">Filtered by Author:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/25 border border-primary/40 px-3 py-1 text-xs font-semibold text-text">
              <User className="h-3.5 w-3.5 text-primary" />
              {author}
              <button
                type="button"
                onClick={() => setAuthor("")}
                className="hover:text-primary hover:bg-primary/20 p-0.5 rounded-full"
                aria-label="Clear author filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}

        {/* Filter Summary & Quick Reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs">
            <span className="text-text-muted">
              Displaying <strong>{data?.books.length ?? 0}</strong> of {data?.total ?? 0} matching stories
            </span>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <RotateCcw className="h-3 w-3" /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Book Catalog Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-[2/3] animate-pulse rounded-2xl bg-surface-soft/80 border border-border/40"
            />
          ))}
        </div>
      ) : !data || data.books.length === 0 ? (
        <div className="card p-14 text-center space-y-4 border border-border/80 shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-primary/70" />
          <h2 className="font-serif text-2xl font-semibold">No stories match your selection</h2>
          <p className="mx-auto max-w-md text-sm text-text-muted">
            Try choosing a different genre tag, or suggest this title to our library curators.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn btn-ghost btn-sm"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              Request This Book
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          {data.total > data.books.length && (
            <div className="flex justify-center pt-8">
              <button
                type="button"
                onClick={() => setPageSize((prev) => prev + 12)}
                className="btn btn-ghost px-8 shadow-sm"
              >
                Load More Books ({data.total - data.books.length} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Mobile Filter Sheet */}
      {mobileSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter Books"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 sm:hidden backdrop-blur-xs"
        >
          <div className="rounded-t-3xl border-t border-border bg-surface p-6 pb-20 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="font-serif text-lg font-semibold">Filter Salon</h2>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterControls />
            <button
              type="button"
              onClick={() => setMobileSheetOpen(false)}
              className="btn btn-primary w-full"
            >
              Apply Selection
            </button>
          </div>
        </div>
      )}

      {/* Request A Book Modal */}
      <RequestBookModal isOpen={requestModalOpen} onClose={() => setRequestModalOpen(false)} />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl p-8 font-serif text-center text-text-muted">Loading salon library…</div>}>
      <BrowseContent />
    </Suspense>
  );
}
