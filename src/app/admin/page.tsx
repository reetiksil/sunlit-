"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BookOpen,
  FileText,
  Users,
  Eye,
  Plus,
  Trash2,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Edit2,
  Inbox,
  CheckCircle,
  XCircle,
  Upload,
  Image as ImageIcon,
  Check,
  Tag,
  Ban,
  UserCheck,
  UserX,
  Star,
  Layers,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import Link from "next/link";
import {
  getAllBooks,
  deleteBook,
  upsertBook,
  getUsers,
  saveChapter,
  deleteChapter,
  reorderChapters,
  getChapters,
  getAdminRequests,
  updateBookRequestStatus,
  getGenres,
  createGenre,
  deleteGenre,
  clearAdminRequests,
  banUser,
  deleteUser,
  getUserActivity,
} from "@/services/api";
import { Book, Chapter, GenreSlug, BookRequest, User, Genre, Review } from "@/types";
import { CustomSelect } from "@/components/ui/CustomSelect";

const ANALYTICS_DATA = [
  { day: "Mon", reads: 3200 },
  { day: "Tue", reads: 3800 },
  { day: "Wed", reads: 4100 },
  { day: "Thu", reads: 3950 },
  { day: "Fri", reads: 4800 },
  { day: "Sat", reads: 5600 },
  { day: "Sun", reads: 6100 },
];

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const { data: books = [] } = useQuery({ queryKey: ["books-all"], queryFn: getAllBooks, enabled: isAdmin });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: getUsers, enabled: isAdmin });
  const { data: requests = [] } = useQuery({ queryKey: ["admin-requests"], queryFn: getAdminRequests, enabled: isAdmin });
  const { data: genres = [] } = useQuery({ queryKey: ["genres"], queryFn: getGenres });

  const [tab, setTab] = useState<"overview" | "books" | "editor" | "requests" | "users" | "genres">("overview");
  const [search, setSearch] = useState("");
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Genre Management State
  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreSlug, setNewGenreSlug] = useState("");
  const [newGenreDesc, setNewGenreDesc] = useState("");

  // User Profile Modal State
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);

  // Book Form State (Create / Edit)
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [bookBlurb, setBookBlurb] = useState("");
  const [bookDesc, setBookDesc] = useState("");
  const [bookGenres, setBookGenres] = useState<GenreSlug[]>(["fantasy"]);
  const [bookStatus, setBookStatus] = useState<"ongoing" | "completed">("ongoing");
  const [bookLanguage, setBookLanguage] = useState("English");
  const [bookCoverUrl, setBookCoverUrl] = useState("");

  // Chapter Editor State
  const [selectedBookId, setSelectedBookId] = useState("");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState("Chapter One");
  const [chapterNumber, setChapterNumber] = useState(1);

  // Fetch chapters for selected book
  const { data: bookChapters = [], refetch: refetchChapters } = useQuery({
    queryKey: ["admin-chapters", selectedBookId],
    queryFn: () => getChapters(selectedBookId),
    enabled: !!selectedBookId,
  });

  // Fetch activity for selected user in profile modal
  const { data: userActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["user-activity", selectedUserForProfile?.id],
    enabled: !!selectedUserForProfile?.id,
    queryFn: () => getUserActivity(selectedUserForProfile!.id),
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Write or paste your chapter prose here…</p>",
  });

  const onError = (e: unknown) =>
    setFlash({ kind: "err", text: e instanceof Error ? e.message : "Something went wrong." });

  // Mutations
  const removeBookMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books-all"] });
      setFlash({ kind: "ok", text: "Book removed successfully." });
    },
    onError,
  });

  const upsertBookMutation = useMutation({
    mutationFn: upsertBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books-all"] });
      resetBookForm();
      setFlash({ kind: "ok", text: editingBookId ? "Book updated." : "Book created." });
    },
    onError,
  });

  const saveChapterMutation = useMutation({
    mutationFn: ({ bookId, chapter }: { bookId: string; chapter: Chapter }) => saveChapter(bookId, chapter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books-all"] });
      refetchChapters();
      setFlash({ kind: "ok", text: "Chapter saved successfully." });
    },
    onError,
  });

  const deleteChapterMutation = useMutation({
    mutationFn: ({ bookId, chapterId }: { bookId: string; chapterId: string }) => deleteChapter(bookId, chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books-all"] });
      refetchChapters();
      setFlash({ kind: "ok", text: "Chapter deleted." });
    },
    onError,
  });

  const reorderMutation = useMutation({
    mutationFn: ({ bookId, chapterIds }: { bookId: string; chapterIds: string[] }) =>
      reorderChapters(bookId, chapterIds),
    onSuccess: () => {
      refetchChapters();
      setFlash({ kind: "ok", text: "Chapters reordered." });
    },
    onError,
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "pending" | "seen" | "fulfilled" | "rejected" }) =>
      updateBookRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setFlash({ kind: "ok", text: "Request status updated." });
    },
    onError,
  });

  const clearRequestsMutation = useMutation({
    mutationFn: (onlyResolved?: boolean) => clearAdminRequests(onlyResolved),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      setFlash({ kind: "ok", text: `Cleared ${data.cleared} book requests.` });
    },
    onError,
  });

  const banUserMutation = useMutation({
    mutationFn: ({ userId, isBanned }: { userId: string; isBanned: boolean }) => banUser(userId, isBanned),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (selectedUserForProfile && selectedUserForProfile.id === vars.userId) {
        setSelectedUserForProfile({ ...selectedUserForProfile, isBanned: vars.isBanned });
      }
      setFlash({ kind: "ok", text: vars.isBanned ? "User account has been banned." : "User ban has been lifted." });
    },
    onError,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedUserForProfile(null);
      setFlash({ kind: "ok", text: "User account removed." });
    },
    onError,
  });

  const addGenreMutation = useMutation({
    mutationFn: (genre: Genre) => createGenre(genre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      setNewGenreName("");
      setNewGenreSlug("");
      setNewGenreDesc("");
      setFlash({ kind: "ok", text: "New genre created successfully." });
    },
    onError,
  });

  const deleteGenreMutation = useMutation({
    mutationFn: (slug: string) => deleteGenre(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["genres"] });
      setFlash({ kind: "ok", text: "Genre removed." });
    },
    onError,
  });

  const resetBookForm = () => {
    setEditingBookId(null);
    setBookTitle("");
    setBookAuthor("");
    setBookBlurb("");
    setBookDesc("");
    setBookGenres(["fantasy"]);
    setBookStatus("ongoing");
    setBookLanguage("English");
    setBookCoverUrl("");
  };

  const startEditBook = (b: Book) => {
    setEditingBookId(b.id);
    setBookTitle(b.title);
    setBookAuthor(b.author);
    setBookBlurb(b.blurb);
    setBookDesc(b.description);
    setBookGenres(b.genres);
    setBookStatus(b.status);
    setBookLanguage(b.language || "English");
    setBookCoverUrl(b.coverImageUrl || "");
    setTab("books");
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFlash({ kind: "err", text: "Cover image must be under 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBookCoverUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim() || !bookAuthor.trim()) return;

    const slug =
      editingBookId && books.find((b) => b.id === editingBookId)?.slug
        ? books.find((b) => b.id === editingBookId)!.slug
        : bookTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `book-${Date.now()}`;

    const bookData: Book = {
      id: editingBookId || `book-${Date.now()}`,
      slug,
      title: bookTitle.trim(),
      author: bookAuthor.trim(),
      blurb: bookBlurb.trim() || "A serene and contemplative tale.",
      description: bookDesc.trim() || bookBlurb.trim() || "A serene and contemplative tale.",
      status: bookStatus,
      genres: bookGenres.length ? bookGenres : ["fantasy"],
      rating: editingBookId ? (books.find((b) => b.id === editingBookId)?.rating ?? 0) : 0,
      views: editingBookId ? (books.find((b) => b.id === editingBookId)?.views ?? 0) : 0,
      language: bookLanguage,
      coverImageUrl: bookCoverUrl || undefined,
      chapterCount: editingBookId ? (books.find((b) => b.id === editingBookId)?.chapterCount ?? 1) : 0,
      coverStyle: {
        gradientFrom: "#FCE7B2",
        gradientTo: "#A8DCC3",
        accentColor: "#2F3B4A",
        motif: "sun",
      },
      updatedAt: new Date().toISOString(),
      createdAt: editingBookId ? (books.find((b) => b.id === editingBookId)?.createdAt ?? new Date().toISOString()) : new Date().toISOString(),
    };

    upsertBookMutation.mutate(bookData);
  };

  const handleMoveChapter = (index: number, direction: "up" | "down") => {
    if (!selectedBookId || !bookChapters.length) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bookChapters.length) return;

    const list = [...bookChapters];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    reorderMutation.mutate({
      bookId: selectedBookId,
      chapterIds: list.map((c) => c.id),
    });
  };

  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;

  if (status === "loading") {
    return <p className="px-4 py-24 text-center text-sm text-text-muted" role="status">Checking your access…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl space-y-5 px-4 py-24 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-primary" aria-hidden />
        <h1 className="font-serif text-3xl font-semibold">Curator Studio Access Required</h1>
        <p className="text-sm text-text-muted">
          {user
            ? "Your account currently has reader access. Only predetermined administrators may access this studio."
            : "Please sign in with administrator credentials."}
        </p>
        <Link href={user ? "/" : "/login?next=/admin"} className="btn btn-primary">
          {user ? "Back to Library" : "Sign In"}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <span className="text-xs uppercase tracking-widest font-bold">Royal Salon Administration</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">Curator Studio</h1>
          <p className="text-xs text-text-muted">Publish literature, manage chapters, and fulfill reader acquisition requests.</p>
        </div>

        <div className="flex flex-wrap rounded-2xl border border-border bg-surface p-1 shadow-sm gap-1">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "books", label: "Book Management" },
              { id: "editor", label: "Chapter Studio" },
              { id: "requests", label: "Requests", badge: pendingRequestsCount },
              { id: "users", label: "Users" },
              { id: "genres", label: "Manage Genres" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`relative rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                tab === item.id ? "bg-primary text-primary-fg shadow-sm" : "text-text-muted hover:text-text"
              }`}
            >
              {item.label}
              {"badge" in item && item.badge > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-danger text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {flash && (
        <div
          role={flash.kind === "err" ? "alert" : "status"}
          className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center justify-between border ${
            flash.kind === "err" ? "bg-accent-blush/25 border-accent-blush/40 text-danger" : "bg-accent-mint/25 border-accent-mint/40 text-text"
          }`}
        >
          <span>{flash.text}</span>
          <button type="button" onClick={() => setFlash(null)} className="text-xs font-bold ml-2">✕</button>
        </div>
      )}

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Catalog Books", value: books.length, icon: BookOpen },
              { label: "Published Chapters", value: books.reduce((n, b) => n + b.chapterCount, 0), icon: FileText },
              { label: "Pending Requests", value: pendingRequestsCount, icon: Inbox },
              { label: "Registered Readers", value: users.length, icon: Users },
            ].map((stat) => (
              <div key={stat.label} className="card p-5 space-y-2 border border-border">
                <stat.icon className="h-5 w-5 text-primary" />
                <p className="font-serif text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-6 border border-border">
            <h2 className="font-serif text-lg font-semibold mb-4">Reading salon Traffic & Trends</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ANALYTICS_DATA}>
                  <XAxis dataKey="day" stroke="#9AA6BD" fontSize={12} />
                  <YAxis stroke="#9AA6BD" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="reads" stroke="#F6B94C" fill="#F6B94C" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Books Tab (Add, Edit, Delete Books) */}
      {tab === "books" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Book Form (Create / Edit) */}
          <form onSubmit={handleSaveBook} className="card p-6 space-y-4 border border-border lg:col-span-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="font-serif text-xl font-bold">
                {editingBookId ? "Edit Book" : "Add New Book"}
              </h2>
              {editingBookId && (
                <button type="button" onClick={resetBookForm} className="text-xs text-primary hover:underline">
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="field">
              <label className="label">Book Title *</label>
              <input
                type="text"
                required
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Title"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Author *</label>
              <input
                type="text"
                required
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="Author Name"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="label">Status</label>
                <CustomSelect
                  value={bookStatus}
                  onChange={(val) => setBookStatus(val as "ongoing" | "completed")}
                  options={[
                    { value: "ongoing", label: "Ongoing" },
                    { value: "completed", label: "Completed" },
                  ]}
                />
              </div>
              <div className="field">
                <label className="label">Language</label>
                <input
                  type="text"
                  value={bookLanguage}
                  onChange={(e) => setBookLanguage(e.target.value)}
                  placeholder="English"
                  className="input"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Genres (Multi-select)</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-bg/50">
                {genres.map((g) => {
                  const active = bookGenres.includes(g.slug);
                  return (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() =>
                        setBookGenres((prev) =>
                          active ? prev.filter((s) => s !== g.slug) : [...prev, g.slug]
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-fg font-semibold shadow-xs"
                          : "border border-border/60 hover:bg-surface-soft"
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label className="label">Short Blurb</label>
              <input
                type="text"
                value={bookBlurb}
                onChange={(e) => setBookBlurb(e.target.value)}
                placeholder="One-sentence teaser"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Full Description</label>
              <textarea
                rows={3}
                value={bookDesc}
                onChange={(e) => setBookDesc(e.target.value)}
                placeholder="Full synopsis…"
                className="input py-2 h-auto resize-none"
              />
            </div>

            {/* Cover Image Upload / URL */}
            <div className="field">
              <label className="label">Cover Image</label>
              <div className="flex items-center gap-3">
                {bookCoverUrl ? (
                  <div className="relative h-16 w-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bookCoverUrl} alt="Cover preview" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-12 rounded-lg border border-dashed border-border flex items-center justify-center bg-surface-soft flex-shrink-0">
                    <ImageIcon className="h-5 w-5 text-text-muted" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <label className="btn btn-ghost btn-sm cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Upload File
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                  <input
                    type="url"
                    value={bookCoverUrl}
                    onChange={(e) => setBookCoverUrl(e.target.value)}
                    placeholder="Or paste image URL"
                    className="input h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={upsertBookMutation.isPending} className="btn btn-primary w-full shadow-md">
              {upsertBookMutation.isPending ? "Saving…" : editingBookId ? "Update Book" : "Create Book"}
            </button>
          </form>

          {/* Book Catalog Table */}
          <div className="card p-6 space-y-4 border border-border lg:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold">Books in Catalog ({books.length})</h2>
              <input
                type="search"
                placeholder="Search catalog…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input h-9 w-48 text-xs"
              />
            </div>

            <div className="divide-y divide-border/70 overflow-hidden">
              {books
                .filter((b) => b.title.toLowerCase().includes(search.toLowerCase()))
                .map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {b.coverImageUrl ? (
                        <div className="h-12 w-9 rounded overflow-hidden flex-shrink-0 border border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={b.coverImageUrl} alt={b.title} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div
                          className="h-12 w-9 rounded flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white uppercase text-center p-0.5"
                          style={{ background: `linear-gradient(135deg, ${b.coverStyle.gradientFrom}, ${b.coverStyle.gradientTo})` }}
                        >
                          {b.title.slice(0, 3)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-serif font-medium truncate">{b.title}</p>
                        <p className="text-xs text-text-muted truncate">
                          {b.author} · {b.status} · {b.chapterCount} chapters
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBookId(b.id);
                          setTab("editor");
                        }}
                        className="btn btn-ghost btn-sm text-xs"
                      >
                        Chapters
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditBook(b)}
                        className="p-2 text-text-muted hover:text-text rounded-lg"
                        title="Edit Book"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${b.title}" and its chapters?`)) {
                            removeBookMutation.mutate(b.id);
                          }
                        }}
                        className="p-2 text-danger hover:bg-accent-blush/20 rounded-lg"
                        title="Delete Book"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Chapter Studio Tab (Add, Edit, Reorder, Delete Chapters) */}
      {tab === "editor" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Chapter Composer */}
          <div className="card p-6 space-y-4 border border-border lg:col-span-7">
            <h2 className="font-serif text-xl font-bold">Chapter Composer</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
              <div className="field">
                <label className="label">Target Book *</label>
                <CustomSelect
                  searchable={true}
                  placeholder="Search or choose a book…"
                  value={selectedBookId}
                  onChange={(val) => {
                    setSelectedBookId(val);
                    setEditingChapterId(null);
                  }}
                  options={[
                    { value: "", label: "Choose a book…" },
                    ...books.map((b) => ({
                      value: b.id,
                      label: b.title,
                      sublabel: b.author,
                    })),
                  ]}
                />
              </div>
              <div className="field">
                <label className="label">Chapter #</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={chapterNumber}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setChapterNumber(Number.isInteger(val) && val >= 0 ? val : 0);
                  }}
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Chapter Title *</label>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="e.g. Chapter 1: The Gathering Dawn"
                className="input font-serif"
              />
            </div>

            <div className="field">
              <label className="label">Prose Content</label>
              <div className="min-h-[260px] rounded-2xl border border-border bg-bg p-4 prose max-w-none text-text">
                <EditorContent editor={editor} />
              </div>
            </div>

            <div className="flex gap-2">
              {editingChapterId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingChapterId(null);
                    setChapterTitle("Chapter Next");
                    setChapterNumber((bookChapters.length || 0) + 1);
                    editor?.commands.setContent("<p>Write chapter text here…</p>");
                  }}
                  className="btn btn-ghost"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary flex-1 shadow-md"
                disabled={!selectedBookId || !chapterTitle.trim() || saveChapterMutation.isPending}
                onClick={() => {
                  const text = editor?.getText({ blockSeparator: "\n\n" }) ?? "";
                  const content = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
                  if (!content.length) {
                    setFlash({ kind: "err", text: "Please write some chapter content." });
                    return;
                  }
                  saveChapterMutation.mutate({
                    bookId: selectedBookId,
                    chapter: {
                      id: editingChapterId || `${selectedBookId}-ch-${chapterNumber}-${Date.now()}`,
                      bookId: selectedBookId,
                      number: chapterNumber,
                      title: chapterTitle.trim(),
                      content,
                      wordCount: content.join(" ").split(/\s+/).length,
                      publishedAt: new Date().toISOString(),
                      status: "published",
                    },
                  });
                }}
              >
                {saveChapterMutation.isPending ? "Saving…" : editingChapterId ? "Update Chapter" : "Save Chapter"}
              </button>
            </div>
          </div>

          {/* Chapters Reorder & Delete List */}
          <div className="card p-6 space-y-4 border border-border lg:col-span-5">
            <h2 className="font-serif text-xl font-bold">
              Existing Chapters ({bookChapters.length})
            </h2>
            {!selectedBookId ? (
              <p className="text-xs text-text-muted">Select a book on the left to inspect and reorder its chapters.</p>
            ) : bookChapters.length === 0 ? (
              <p className="text-xs text-text-muted">No chapters published for this book yet.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {bookChapters.map((ch, idx) => (
                  <div key={ch.id} className="flex items-center justify-between py-3 gap-2">
                    <div className="min-w-0">
                      <p className="font-serif font-medium text-sm truncate">
                        {ch.number}. {ch.title}
                      </p>
                      <p className="text-[11px] text-text-muted">{ch.wordCount.toLocaleString()} words</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0 || reorderMutation.isPending}
                        onClick={() => handleMoveChapter(idx, "up")}
                        className="p-1 rounded hover:bg-surface-soft disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === bookChapters.length - 1 || reorderMutation.isPending}
                        onClick={() => handleMoveChapter(idx, "down")}
                        className="p-1 rounded hover:bg-surface-soft disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChapterId(ch.id);
                          setChapterTitle(ch.title);
                          setChapterNumber(ch.number);
                          const escapeHtml = (s: string) =>
                            s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                          editor?.commands.setContent(
                            ch.content.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`).join("")
                          );
                        }}
                        className="p-1 text-text-muted hover:text-text rounded"
                        title="Edit Chapter"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete chapter "${ch.title}"?`)) {
                            deleteChapterMutation.mutate({ bookId: selectedBookId, chapterId: ch.id });
                          }
                        }}
                        className="p-1 text-danger hover:bg-accent-blush/20 rounded"
                        title="Delete Chapter"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book Requests Tab (Notifications, Review, Fulfill/Reject & Clear) */}
      {tab === "requests" && (
        <div className="card p-6 space-y-5 border border-border shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <h2 className="font-serif text-xl font-bold">Reader Book Requests</h2>
              <p className="text-xs text-text-muted">Review book proposals from verified readers.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-text font-semibold">
                {pendingRequestsCount} Pending
              </span>
              {requests.length > 0 && (
                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    type="button"
                    disabled={clearRequestsMutation.isPending}
                    onClick={() => {
                      if (window.confirm("Clear all fulfilled and rejected requests?")) {
                        clearRequestsMutation.mutate(true);
                      }
                    }}
                    className="btn btn-ghost btn-sm text-xs"
                    title="Clear resolved requests"
                  >
                    Clear Resolved
                  </button>
                  <button
                    type="button"
                    disabled={clearRequestsMutation.isPending}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear ALL requests?")) {
                        clearRequestsMutation.mutate(false);
                      }
                    }}
                    className="btn btn-danger btn-sm text-xs inline-flex items-center gap-1"
                    title="Clear all requests"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {requests.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">No reader requests submitted yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {requests.map((req) => (
                <div key={req.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-semibold text-base text-text">
                        {req.title} <span className="font-normal text-text-muted">by {req.author}</span>
                      </h3>
                      <p className="text-xs text-text-muted">
                        Requested by <strong>{req.userName}</strong> ({req.userEmail}) · {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                      {req.note && (
                        <p className="mt-1 text-xs italic bg-surface-soft p-2 rounded-lg border border-border/40">
                          &ldquo;{req.note}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider text-[10px] ${
                          req.status === "fulfilled"
                            ? "bg-accent-mint/30 text-green-700 dark:text-green-300"
                            : req.status === "rejected"
                            ? "bg-accent-blush/30 text-danger"
                            : req.status === "seen"
                            ? "bg-accent-sky/30 text-accent-sky-fg"
                            : "bg-primary/25 text-primary-fg"
                        }`}
                      >
                        {req.status}
                      </span>

                      {req.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => updateRequestMutation.mutate({ id: req.id, status: "seen" })}
                          className="btn btn-ghost btn-sm text-xs"
                        >
                          Mark Seen
                        </button>
                      )}

                      {req.status !== "fulfilled" && (
                        <button
                          type="button"
                          onClick={() => updateRequestMutation.mutate({ id: req.id, status: "fulfilled" })}
                          className="btn btn-primary btn-sm text-xs inline-flex items-center gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Fulfill
                        </button>
                      )}

                      {req.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => updateRequestMutation.mutate({ id: req.id, status: "rejected" })}
                          className="btn btn-danger btn-sm text-xs inline-flex items-center gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab with Profile View, Ban, and Delete */}
      {tab === "users" && (
        <div className="card p-6 border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="font-serif text-xl font-bold">Registered Community Members ({users.length})</h2>
              <p className="text-xs text-text-muted">Manage readers, inspect activity profiles, and handle moderation.</p>
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between py-3.5 text-sm gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text">{u.name}</p>
                    {u.isBanned && (
                      <span className="rounded-full bg-danger/20 border border-danger/40 px-2 py-0.5 text-[10px] font-bold text-danger">
                        Banned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${
                      u.role === "admin" ? "bg-primary text-primary-fg" : "bg-surface-soft text-text"
                    }`}
                  >
                    {u.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedUserForProfile(u)}
                    className="btn btn-ghost btn-sm text-xs inline-flex items-center gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5 text-primary" /> View Profile & Activity
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Genres Tab */}
      {tab === "genres" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Create New Genre */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newGenreName.trim()) return;
              const slug = (newGenreSlug.trim() || newGenreName.trim().toLowerCase().replace(/\s+/g, "-")) as GenreSlug;
              addGenreMutation.mutate({
                id: `genre-${Date.now()}`,
                name: newGenreName.trim(),
                slug,
                description: newGenreDesc.trim() || "Serene reading mood",
                colorToken: "primary",
              });
            }}
            className="card p-6 space-y-4 border border-border lg:col-span-5 shadow-sm"
          >
            <h2 className="font-serif text-xl font-bold flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" /> Add New Genre / Mood
            </h2>
            <p className="text-xs text-text-muted">
              Add new catalog filters and reading moods to the library filter salon.
            </p>

            <div className="field">
              <label className="label">Genre Name *</label>
              <input
                type="text"
                required
                value={newGenreName}
                onChange={(e) => setNewGenreName(e.target.value)}
                placeholder="e.g. Historical Fiction"
                className="input"
              />
            </div>

            <div className="field">
              <label className="label">Genre Slug (optional URL identifier)</label>
              <input
                type="text"
                value={newGenreSlug}
                onChange={(e) => setNewGenreSlug(e.target.value)}
                placeholder="e.g. historical-fiction"
                className="input font-mono text-xs"
              />
            </div>

            <div className="field">
              <label className="label">Description</label>
              <textarea
                rows={2}
                value={newGenreDesc}
                onChange={(e) => setNewGenreDesc(e.target.value)}
                placeholder="A brief tranquil description of this mood…"
                className="input py-2 h-auto resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={addGenreMutation.isPending || !newGenreName.trim()}
              className="btn btn-primary w-full shadow-sm"
            >
              {addGenreMutation.isPending ? "Creating…" : "Add Genre to Catalog"}
            </button>
          </form>

          {/* Existing Genres List */}
          <div className="card p-6 space-y-4 border border-border lg:col-span-7 shadow-sm">
            <h2 className="font-serif text-xl font-bold">Catalog Genres ({genres.length})</h2>
            <div className="divide-y divide-border/60">
              {genres.map((g) => (
                <div key={g.id} className="flex items-center justify-between py-3 gap-2">
                  <div>
                    <p className="font-semibold text-sm text-text flex items-center gap-2">
                      {g.name}
                      <span className="font-mono text-[10px] text-text-muted bg-surface-soft px-2 py-0.5 rounded">
                        /{g.slug}
                      </span>
                    </p>
                    <p className="text-xs text-text-muted">{g.description}</p>
                  </div>
                  {/* Allow deleting custom genres */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove genre "${g.name}" from catalog filters?`)) {
                        deleteGenreMutation.mutate(g.slug);
                      }
                    }}
                    className="p-1.5 text-danger hover:bg-danger/10 rounded-lg"
                    title="Remove Genre"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Profile & Activity Modal */}
      {selectedUserForProfile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setSelectedUserForProfile(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl font-bold text-text">{selectedUserForProfile.name}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                      selectedUserForProfile.role === "admin"
                        ? "bg-primary text-primary-fg"
                        : "bg-surface-soft text-text"
                    }`}
                  >
                    {selectedUserForProfile.role}
                  </span>
                  {selectedUserForProfile.isBanned ? (
                    <span className="rounded-full bg-danger/20 border border-danger/40 px-2 py-0.5 text-xs font-bold text-danger">
                      Banned
                    </span>
                  ) : (
                    <span className="rounded-full bg-accent-mint/30 px-2 py-0.5 text-xs font-medium text-text">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{selectedUserForProfile.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForProfile(null)}
                className="text-text-muted hover:text-text p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Moderation Controls (Ban / Unban / Remove) */}
            {selectedUserForProfile.role !== "admin" && (
              <div className="rounded-2xl border border-border/70 bg-surface-soft/60 p-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-text">Account Moderation:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={banUserMutation.isPending}
                    onClick={() =>
                      banUserMutation.mutate({
                        userId: selectedUserForProfile.id,
                        isBanned: !selectedUserForProfile.isBanned,
                      })
                    }
                    className={`btn btn-sm text-xs inline-flex items-center gap-1.5 ${
                      selectedUserForProfile.isBanned
                        ? "btn-primary"
                        : "border border-amber-600/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                    }`}
                  >
                    {selectedUserForProfile.isBanned ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" /> Lift Ban
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5" /> Ban User
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={deleteUserMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Permanently remove user "${selectedUserForProfile.name}"?`)) {
                        deleteUserMutation.mutate(selectedUserForProfile.id);
                      }
                    }}
                    className="btn btn-danger btn-sm text-xs inline-flex items-center gap-1.5"
                  >
                    <UserX className="h-3.5 w-3.5" /> Remove User
                  </button>
                </div>
              </div>
            )}

            {/* User Activity: Reviews & Book Requests */}
            <div className="space-y-6">
              {/* User Reviews */}
              <div className="space-y-3">
                <h4 className="font-serif text-base font-bold text-text flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Reader Reflections & Reviews ({userActivity?.reviews.length ?? 0})
                </h4>
                {isLoadingActivity ? (
                  <p className="text-xs text-text-muted">Loading activity…</p>
                ) : !userActivity?.reviews.length ? (
                  <p className="text-xs text-text-muted italic bg-surface-soft/40 p-3 rounded-xl border border-border/40">
                    No book reflections submitted by this user yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userActivity.reviews.map((rev) => (
                      <div key={rev.id} className="rounded-xl border border-border/60 bg-surface-soft/30 p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-text flex items-center gap-1">
                            {"★".repeat(rev.rating)} {rev.title || "Reflection"}
                          </span>
                          <span className="text-text-muted text-[11px]">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-text-muted whitespace-pre-line">{rev.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Book Requests */}
              <div className="space-y-3 border-t border-border/60 pt-4">
                <h4 className="font-serif text-base font-bold text-text flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Submitted Book Proposals ({userActivity?.requests.length ?? 0})
                </h4>
                {isLoadingActivity ? (
                  <p className="text-xs text-text-muted">Loading proposals…</p>
                ) : !userActivity?.requests.length ? (
                  <p className="text-xs text-text-muted italic bg-surface-soft/40 p-3 rounded-xl border border-border/40">
                    No book requests submitted by this user yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userActivity.requests.map((req) => (
                      <div key={req.id} className="rounded-xl border border-border/60 bg-surface-soft/30 p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-text">
                            {req.title} <span className="font-normal text-text-muted">by {req.author}</span>
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-soft border border-border/60">
                            {req.status}
                          </span>
                        </div>
                        {req.note && <p className="text-xs italic text-text-muted">&ldquo;{req.note}&rdquo;</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
