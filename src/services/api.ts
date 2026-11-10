import { GENRES } from "@/data/seed";
import { Book, BookFilterParams, BookRequest, Chapter, Genre, Review, User } from "@/types";

export function filterAndSortBooks(books: Book[], filters?: BookFilterParams): Book[] {
  let result = [...books];

  if (filters?.query && filters.query.trim() !== "") {
    const q = filters.query.toLowerCase().trim();
    result = result.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.blurb.toLowerCase().includes(q)
    );
  }

  if (filters?.author && filters.author.trim() !== "") {
    const authorQuery = filters.author.toLowerCase().trim();
    result = result.filter(
      (b) => b.author.toLowerCase() === authorQuery || b.author.toLowerCase().includes(authorQuery)
    );
  }

  if (filters?.genres && filters.genres.length > 0) {
    result = result.filter((b) =>
      filters.genres!.every((g) => b.genres.includes(g))
    );
  }

  if (filters?.status && filters.status !== "all") {
    result = result.filter((b) => b.status === filters.status);
  }

  const sort = filters?.sort ?? "popular";
  result.sort((a, b) => {
    if (sort === "popular") return b.views - a.views;
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sort === "az") return a.title.localeCompare(b.title);
    return 0;
  });

  return result;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

const fetchBooks = () => request<Book[]>("/api/catalog/books", { cache: "no-store" });

export async function getBooks(filters?: BookFilterParams): Promise<{ books: Book[]; total: number }> {
  const filtered = filterAndSortBooks(await fetchBooks(), filters);
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 12;
  const start = (page - 1) * pageSize;
  return { books: filtered.slice(start, start + pageSize), total: filtered.length };
}

export async function getAllBooks(): Promise<Book[]> {
  return fetchBooks();
}

export async function getBook(slug: string): Promise<Book | null> {
  return (await fetchBooks()).find((b) => b.slug === slug) ?? null;
}

export async function getChapters(bookId: string): Promise<Chapter[]> {
  return request<Chapter[]>(`/api/catalog/chapters?bookId=${encodeURIComponent(bookId)}`, { cache: "no-store" });
}

export async function getChapter(
  bookSlug: string,
  chapterNumber: number
): Promise<{ book: Book; chapter: Chapter; totalChapters: number } | null> {
  const book = await getBook(bookSlug);
  if (!book) return null;
  const list = await getChapters(book.id);
  const chapter = list.find((c) => c.number === chapterNumber);
  if (!chapter) return null;
  return { book, chapter, totalChapters: list.length };
}

export async function searchBooks(query: string): Promise<Book[]> {
  if (!query.trim()) return [];
  return filterAndSortBooks(await fetchBooks(), { query }).slice(0, 6);
}

export async function getGenres(): Promise<Genre[]> {
  try {
    const res = await request<Genre[]>("/api/catalog/genres", { cache: "no-store" });
    if (Array.isArray(res) && res.length > 0) return res;
  } catch {
    // fallback to static genres
  }
  return GENRES;
}

export const createGenre = (genre: Genre) =>
  request<Genre>("/api/catalog/genres", { method: "POST", body: JSON.stringify(genre) });

export const deleteGenre = (slug: string) =>
  request<{ ok: true }>(`/api/catalog/genres?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });

export const getReviews = (bookId: string) =>
  request<Review[]>(`/api/catalog/books/${encodeURIComponent(bookId)}/reviews`, { cache: "no-store" });

export const postReview = (bookId: string, data: { id?: string; rating: number; title?: string; content: string }) =>
  request<Review>(`/api/catalog/books/${encodeURIComponent(bookId)}/reviews`, { method: "POST", body: JSON.stringify(data) });

export const deleteReview = (bookId: string, reviewId: string) =>
  request<{ ok: true }>(`/api/catalog/books/${encodeURIComponent(bookId)}/reviews?reviewId=${encodeURIComponent(reviewId)}`, {
    method: "DELETE",
  });

export const recordBookView = (bookId: string) =>
  request<{ ok: true; views: number }>(`/api/catalog/books/${encodeURIComponent(bookId)}/view`, { method: "POST" }).catch(
    () => ({ ok: false, views: 0 })
  );

/* ---- admin-only (enforced server-side: these endpoints return 401/403 for non-admins) ---- */

export const getUsers = () => request<User[]>("/api/admin/users", { cache: "no-store" });

export const banUser = (userId: string, isBanned: boolean) =>
  request<{ ok: true; isBanned: boolean }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify({ isBanned }),
  });

export const deleteUser = (userId: string) =>
  request<{ ok: true }>(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" });

export const getUserActivity = (userId: string) =>
  request<{ reviews: Review[]; requests: BookRequest[] }>(`/api/admin/users/${encodeURIComponent(userId)}/activity`, {
    cache: "no-store",
  });

export const clearAdminRequests = (onlyResolved = false) =>
  request<{ ok: true; cleared: number }>(`/api/admin/requests${onlyResolved ? "?onlyResolved=true" : ""}`, {
    method: "DELETE",
  });

export const upsertBook = (book: Book) =>
  request<Book>("/api/admin/books", { method: "POST", body: JSON.stringify(book) });

export const deleteBook = (bookId: string) =>
  request<{ ok: true }>(`/api/admin/books/${encodeURIComponent(bookId)}`, { method: "DELETE" }).then(() => undefined);

export const saveChapter = (bookId: string, chapter: Chapter) =>
  request<Chapter>("/api/admin/chapters", { method: "PUT", body: JSON.stringify({ bookId, chapter }) });

export const deleteChapter = (bookId: string, chapterId: string) =>
  request<{ ok: true }>("/api/admin/chapters", { method: "DELETE", body: JSON.stringify({ bookId, chapterId }) });

export const reorderChapters = (bookId: string, chapterIds: string[]) =>
  request<Chapter[]>("/api/admin/chapters", { method: "PATCH", body: JSON.stringify({ bookId, chapterIds }) });

export const getAdminRequests = () => request<BookRequest[]>("/api/admin/requests", { cache: "no-store" });

export const updateBookRequestStatus = (id: string, status: "pending" | "seen" | "fulfilled" | "rejected") =>
  request<BookRequest>(`/api/admin/requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const submitBookRequest = (data: {
  title: string;
  author: string;
  note?: string;
  email?: string;
  name?: string;
  otp?: string;
}) => request<BookRequest>("/api/requests", { method: "POST", body: JSON.stringify(data) });

export const sendRequestOtp = (email?: string) =>
  request<{ ok: true; email: string; deliveryMethod: string; message: string }>("/api/requests/send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const getUserRequests = () => request<BookRequest[]>("/api/requests", { cache: "no-store" });

export const sendVerificationOtp = (email: string) =>
  request<{ ok: true; message: string }>("/api/auth/send-verification-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const verifyRegistrationOtp = (email: string, code: string) =>
  request<{ ok: true; message: string }>("/api/auth/verify-registration-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

export const requestPasswordReset = (email: string) =>
  request<{ ok: true; message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (data: { email: string; code: string; newPassword: string }) =>
  request<{ ok: true; message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
