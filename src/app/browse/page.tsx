"use client";

import React, { Suspense, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  Sparkles,
  BookPlus,
  RotateCcw,
  User,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { getBooks, getGenres, createGenre, deleteGenre } from "@/services/api";
import { BookCard } from "@/components/book/BookCard";
import { BookStatus, Genre, GenreSlug } from "@/types";
import { RequestBookModal } from "@/components/book/RequestBookModal";
import { ContinueReadingShelf } from "@/components/book/ContinueReadingShelf";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useAuthStore } from "@/stores/useAuthStore";

function AdminAddGenreBox({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (genre: Genre) => createGenre(genre),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      setName("");
      setSlug("");
      setDescription("");
      setError(null);
      onSuccess(`Added "${created.name}" to catalog genres.`);
      onClose();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not create genre.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    const autoSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const resolvedSlug = (slug.trim().toLowerCase() || autoSlug) as GenreSlug;

    addMutation.mutate({
      id: `genre-${Date.now()}`,
      name: name.trim(),
      slug: resolvedSlug,
      description: description.trim() || "Serene reading mood",
      colorToken: "primary",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-primary/30 bg-surface-soft/70 p-4 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-1"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-primary" /> Add New Genre / Mood
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-text-muted hover:text-text p-1 rounded-md"
          aria-label="Close add genre panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-text-muted">Genre Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Historical Fiction"
            className="input h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-text-muted">Slug (optional)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. historical-fiction"
            className="input h-9 font-mono text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-text-muted">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of this mood…"
          className="input h-9 text-xs"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm text-xs">
          Cancel
        </button>
        <button
          type="submit"
          disabled={addMutation.isPending || !name.trim()}
          className="btn btn-primary btn-sm text-xs inline-flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          {addMutation.isPending ? "Adding…" : "Add Genre to Catalog"}
        </button>
      </div>
    </form>
  );
}

interface FilterControlsProps {
  genres: Genre[];
  selectedGenres: GenreSlug[];
  toggleGenre: (slug: GenreSlug) => void;
  status: BookStatus | "all";
  setStatus: (s: BookStatus | "all") => void;
  sort: "popular" | "newest" | "rating" | "az";
  setSort: (s: "popular" | "newest" | "rating" | "az") => void;
  isAdmin: boolean;
  showAddGenre: boolean;
  setShowAddGenre: React.Dispatch<React.SetStateAction<boolean>>;
  manageGenres: boolean;
  setManageGenres: React.Dispatch<React.SetStateAction<boolean>>;
  onDeleteGenre: (slug: string, name: string) => void;
  onGenreAdded: (msg: string) => void;
}

function FilterControls({
  genres,
  selectedGenres,
  toggleGenre,
  status,
  setStatus,
  sort,
  setSort,
  isAdmin,
  showAddGenre,
  setShowAddGenre,
  manageGenres,
  setManageGenres,
  onDeleteGenre,
  onGenreAdded,
}: FilterControlsProps) {
  return (
    <div className="space-y-6">
      {/* Royal Genre Selection */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-serif text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            <span>✦</span> Curated Moods & Genres
          </span>
          <div className="flex items-center gap-2">
            {selectedGenres.length > 0 && (
              <span className="text-[11px] font-medium text-primary">
                {selectedGenres.length} selected
              </span>
            )}
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddGenre((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                    showAddGenre
                      ? "bg-primary text-primary-fg border-primary"
                      : "border-primary/35 text-primary hover:bg-primary/10"
                  }`}
                >
                  <Plus className="h-3 w-3" /> Add Genre
                </button>
                <button
                  type="button"
                  onClick={() => setManageGenres((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                    manageGenres
                      ? "bg-danger/15 text-danger border-danger/40"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  {manageGenres ? "Done" : "Manage"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {genres.map((g) => {
            const active = selectedGenres.includes(g.slug);
            return (
              <div key={g.id} className="inline-flex items-center gap-0.5">
                <button
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
                {isAdmin && manageGenres && (
                  <button
                    type="button"
                    onClick={() => onDeleteGenre(g.slug, g.name)}
                    className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                    title={`Remove genre "${g.name}"`}
                    aria-label={`Remove genre ${g.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && showAddGenre && (
          <div className="pt-2">
            <AdminAddGenreBox
              onClose={() => setShowAddGenre(false)}
              onSuccess={onGenreAdded}
            />
          </div>
        )}
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
}

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

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
  const [showAddGenre, setShowAddGenre] = useState(false);
  const [manageGenres, setManageGenres] = useState(false);
  const [genreNotice, setGenreNotice] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const deleteGenreMutation = useMutation({
    mutationFn: (slug: string) => deleteGenre(slug),
    onSuccess: (_res, deletedSlug) => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      setSelectedGenres((prev) => prev.filter((g) => g !== deletedSlug));
      setGenreNotice("Genre removed from catalog.");
    },
    onError: (err) => {
      setGenreNotice(err instanceof Error ? err.message : "Could not remove genre.");
    },
  });

  const handleDeleteGenre = (slug: string, name: string) => {
    if (window.confirm(`Remove genre "${name}" from catalog filters?`)) {
      deleteGenreMutation.mutate(slug);
    }
  };

  const handleGenreAdded = (msg: string) => {
    setGenreNotice(msg);
  };

  const filterProps: FilterControlsProps = {
    genres,
    selectedGenres,
    toggleGenre,
    status,
    setStatus,
    sort,
    setSort,
    isAdmin,
    showAddGenre,
    setShowAddGenre,
    manageGenres,
    setManageGenres,
    onDeleteGenre: handleDeleteGenre,
    onGenreAdded: handleGenreAdded,
  };

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

        {/* Search Bar + Mobile Filter Trigger inside Filter Box */}
        <div className="flex flex-col gap-2.5 sm:block">
          <div className="relative flex-1">
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

          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="flex sm:hidden w-full items-center justify-between rounded-xl border border-border/80 bg-surface-soft/70 px-4 py-2.5 text-xs font-semibold text-text hover:border-primary/40 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Moods, Genres & Sort
            </span>
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              {selectedGenres.length + (status !== "all" ? 1 : 0) + (sort !== "popular" ? 1 : 0) > 0
                ? `${selectedGenres.length + (status !== "all" ? 1 : 0) + (sort !== "popular" ? 1 : 0)} active`
                : "Filter"}
            </span>
          </button>
        </div>

        {genreNotice && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-medium text-text"
          >
            <span>{genreNotice}</span>
            <button
              type="button"
              onClick={() => setGenreNotice(null)}
              className="ml-2 text-text-muted hover:text-text"
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

        {/* Desktop Filter Controls */}
        <div className="hidden sm:block">
          <FilterControls {...filterProps} />
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs">
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
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-[2/3] animate-pulse rounded-2xl bg-surface-soft/80 border border-border/40"
            />
          ))}
        </div>
      ) : !data || data.books.length === 0 ? (
        <div className="card p-10 sm:p-14 text-center space-y-4 border border-border/80 shadow-sm">
          <BookOpen className="mx-auto h-12 w-12 text-primary/70" />
          <h2 className="font-serif text-2xl font-semibold">No stories match your selection</h2>
          <p className="mx-auto max-w-md text-sm text-text-muted">
            Try choosing a different genre tag, or suggest this title to our library curators.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
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
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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

      {/* Mobile Filter Sheet (portaled cleanly to document.body so it stays locked to screen) */}
      {mounted &&
        mobileSheetOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter Books"
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 sm:hidden backdrop-blur-xs"
            onClick={() => setMobileSheetOpen(false)}
          >
            <div
              className="drawer-in rounded-t-3xl border-t border-border bg-surface p-5 pb-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto text-text"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="font-serif text-lg font-semibold">Filter Salon</h2>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft text-text"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <FilterControls {...filterProps} />
              <div className="flex gap-2.5 pt-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="btn btn-ghost flex-1"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  className="btn btn-primary flex-[2]"
                >
                  Apply Selection
                </button>
              </div>
            </div>
          </div>,
          document.body
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
