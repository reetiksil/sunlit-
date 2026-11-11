import { promises as fs } from "fs";
import path from "path";
import { SEED_BOOKS, SEED_CHAPTERS, GENRES as SEED_GENRES } from "@/data/seed";
import type { Book, Chapter, Genre, Review, ShelfCategory, ReadingProgress } from "@/types";
import { dataDir } from "@/lib/server/users";

interface UserBookshelfData {
  shelf: Record<string, ShelfCategory>;
  progress: Record<string, ReadingProgress>;
}

interface CatalogState {
  books: Book[];
  chapters: Record<string, Chapter[]>;
  genres: Genre[];
  reviews: Record<string, Review[]>; // bookId -> Review[]
  viewIps: Record<string, Record<string, number>>; // bookId -> { ip -> timestamp }
  userBookshelves: Record<string, UserBookshelfData>; // userId -> UserBookshelfData
}

const file = () => path.join(dataDir(), "catalog.json");
let state: CatalogState | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<CatalogState> {
  if (state) return state;
  try {
    const raw = JSON.parse(await fs.readFile(file(), "utf8")) as Partial<CatalogState>;
    state = {
      books: raw.books ?? structuredClone(SEED_BOOKS),
      chapters: raw.chapters ?? structuredClone(SEED_CHAPTERS),
      genres: raw.genres && raw.genres.length > 0 ? raw.genres : structuredClone(SEED_GENRES),
      reviews: raw.reviews ?? {},
      viewIps: raw.viewIps ?? {},
      userBookshelves: raw.userBookshelves ?? {},
    };
  } catch {
    state = {
      books: structuredClone(SEED_BOOKS),
      chapters: structuredClone(SEED_CHAPTERS),
      genres: structuredClone(SEED_GENRES),
      reviews: {},
      viewIps: {},
      userBookshelves: {},
    };
  }
  return state;
}

async function persist(s: CatalogState) {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${file()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(s, null, 2));
  await fs.rename(tmp, file());
}

function mutate<T>(fn: (s: CatalogState) => T): Promise<T> {
  const run = queue.then(async () => {
    const s = await load();
    const result = fn(s);
    await persist(s);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

/* ===================================================================== */
/* BOOKS & CHAPTERS                                                      */
/* ===================================================================== */

export async function listBooks(): Promise<Book[]> {
  return [...(await load()).books];
}

export async function listChapters(bookId: string): Promise<Chapter[]> {
  return [...((await load()).chapters[bookId] ?? [])].sort((a, b) => a.number - b.number);
}

export function upsertBook(book: Book): Promise<Book> {
  return mutate((s) => {
    const idx = s.books.findIndex((b) => b.id === book.id);
    if (idx >= 0) s.books[idx] = book;
    else {
      if (s.books.some((b) => b.slug === book.slug)) throw new Error("A book with this slug already exists.");
      s.books.unshift(book);
      s.chapters[book.id] = [];
    }
    return book;
  });
}

export function deleteBook(id: string): Promise<void> {
  return mutate((s) => {
    s.books = s.books.filter((b) => b.id !== id);
    delete s.chapters[id];
    delete s.reviews[id];
    delete s.viewIps[id];
  });
}

export function saveChapter(bookId: string, chapter: Chapter): Promise<Chapter> {
  return mutate((s) => {
    const book = s.books.find((b) => b.id === bookId);
    if (!book) throw new Error("Book not found.");
    const list = s.chapters[bookId] ?? [];
    const idx = list.findIndex((c) => c.id === chapter.id || c.number === chapter.number);
    if (idx >= 0) list[idx] = chapter;
    else list.push(chapter);
    s.chapters[bookId] = list;
    book.chapterCount = list.length;
    book.updatedAt = new Date().toISOString();
    return chapter;
  });
}

export function deleteChapter(bookId: string, chapterId: string): Promise<void> {
  return mutate((s) => {
    const book = s.books.find((b) => b.id === bookId);
    if (!book) throw new Error("Book not found.");
    const existing = s.chapters[bookId] ?? [];
    const startsWithZero = existing.some((c) => c.number === 0);
    const list = existing.filter((c) => c.id !== chapterId);
    const baseNumber = startsWithZero ? 0 : 1;
    list.forEach((c, idx) => {
      c.number = idx + baseNumber;
    });
    s.chapters[bookId] = list;
    book.chapterCount = list.length;
    book.updatedAt = new Date().toISOString();
  });
}

export function reorderChapters(bookId: string, chapterIds: string[]): Promise<Chapter[]> {
  return mutate((s) => {
    const book = s.books.find((b) => b.id === bookId);
    if (!book) throw new Error("Book not found.");
    const currentList = s.chapters[bookId] ?? [];
    const startsWithZero = currentList.some((c) => c.number === 0);
    const baseNumber = startsWithZero ? 0 : 1;
    const map = new Map(currentList.map((c) => [c.id, c]));
    const reordered: Chapter[] = [];
    chapterIds.forEach((id, index) => {
      const ch = map.get(id);
      if (ch) {
        ch.number = index + baseNumber;
        reordered.push(ch);
        map.delete(id);
      }
    });
    for (const remaining of map.values()) {
      remaining.number = reordered.length + baseNumber;
      reordered.push(remaining);
    }
    s.chapters[bookId] = reordered;
    book.chapterCount = reordered.length;
    book.updatedAt = new Date().toISOString();
    return reordered;
  });
}

/* ===================================================================== */
/* REAL VIEW COUNTING (IP-TRACKED & GUEST-ENABLED)                       */
/* ===================================================================== */

export function recordBookView(bookId: string, ip: string): Promise<number> {
  return mutate((s) => {
    const book = s.books.find((b) => b.id === bookId || b.slug === bookId);
    if (!book) return 0;

    const bookKey = book.id;
    if (!s.viewIps[bookKey]) s.viewIps[bookKey] = {};

    const cleanIp = ip.replace(/[^a-zA-Z0-9.:_-]/g, "").slice(0, 45) || "anonymous";
    const now = Date.now();
    const lastViewed = s.viewIps[bookKey][cleanIp] || 0;

    // Rate-limit by IP: 1 view count per book per IP every 30 minutes
    if (now - lastViewed > 30 * 60 * 1000) {
      s.viewIps[bookKey][cleanIp] = now;
      book.views = (book.views || 0) + 1;
    }

    return book.views;
  });
}

/* ===================================================================== */
/* GENRES MANAGEMENT                                                     */
/* ===================================================================== */

export async function listGenres(): Promise<Genre[]> {
  return [...(await load()).genres];
}

export function createGenre(genre: Genre): Promise<Genre> {
  return mutate((s) => {
    const exists = s.genres.some(
      (g) => g.slug.toLowerCase() === genre.slug.toLowerCase() || g.name.toLowerCase() === genre.name.toLowerCase()
    );
    if (exists) throw new Error("A genre with this name or slug already exists.");
    s.genres.push(genre);
    return genre;
  });
}

export function deleteGenre(idOrSlug: string): Promise<void> {
  return mutate((s) => {
    s.genres = s.genres.filter((g) => g.id !== idOrSlug && g.slug !== idOrSlug);
  });
}

/* ===================================================================== */
/* USER REVIEWS (WRITE, EDIT, VIEW, DELETE)                              */
/* ===================================================================== */

export async function listReviews(bookId: string): Promise<Review[]> {
  const s = await load();
  const book = s.books.find((b) => b.id === bookId || b.slug === bookId);
  if (!book) return [];
  const list = s.reviews[book.id] ?? [];
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listUserReviews(userId: string): Promise<Array<Review & { bookTitle: string; bookSlug: string }>> {
  const s = await load();
  const results: Array<Review & { bookTitle: string; bookSlug: string }> = [];
  for (const book of s.books) {
    const bookReviews = s.reviews[book.id] ?? [];
    for (const rev of bookReviews) {
      if (rev.userId === userId) {
        results.push({ ...rev, bookTitle: book.title, bookSlug: book.slug });
      }
    }
  }
  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function upsertReview(review: Review): Promise<Review> {
  return mutate((s) => {
    const book = s.books.find((b) => b.id === review.bookId || b.slug === review.bookId);
    if (!book) throw new Error("Book not found.");
    const bookId = book.id;
    review.bookId = bookId;

    if (!s.reviews[bookId]) s.reviews[bookId] = [];
    const list = s.reviews[bookId];
    const targetById = list.find((r) => r.id === review.id);
    if (targetById && targetById.userId !== review.userId) {
      throw new Error("Not authorized to edit this review.");
    }
    const existingIndex = list.findIndex((r) => r.userId === review.userId);

    if (existingIndex >= 0) {
      review.id = list[existingIndex].id;
      review.createdAt = list[existingIndex].createdAt;
      review.updatedAt = new Date().toISOString();
      list[existingIndex] = review;
    } else {
      const now = new Date().toISOString();
      review.createdAt = now;
      review.updatedAt = now;
      list.unshift(review);
    }

    // Recalculate book average rating
    if (list.length > 0) {
      const totalStars = list.reduce((sum, r) => sum + r.rating, 0);
      book.rating = Math.round((totalStars / list.length) * 10) / 10;
    }

    return review;
  });
}

export function deleteReview(bookId: string, reviewId: string): Promise<void> {
  return mutate((s) => {
    const book = s.books.find((b) => b.id === bookId || b.slug === bookId);
    if (!book) return;
    const list = s.reviews[book.id] ?? [];
    s.reviews[book.id] = list.filter((r) => r.id !== reviewId);

    // Update book rating
    const remaining = s.reviews[book.id];
    if (remaining.length > 0) {
      const totalStars = remaining.reduce((sum, r) => sum + r.rating, 0);
      book.rating = Math.round((totalStars / remaining.length) * 10) / 10;
    } else {
      book.rating = 0;
    }
  });
}

/* ===================================================================== */
/* CROSS-DEVICE BOOKSHELF SYNC                                           */
/* ===================================================================== */

export async function getUserBookshelf(
  userId: string
): Promise<UserBookshelfData & { initialized: boolean }> {
  const s = await load();
  const saved = s.userBookshelves[userId];
  if (!saved) {
    return { shelf: {}, progress: {}, initialized: false };
  }
  return { shelf: saved.shelf, progress: saved.progress, initialized: true };
}

export function saveUserBookshelf(userId: string, data: UserBookshelfData): Promise<void> {
  return mutate((s) => {
    s.userBookshelves[userId] = {
      shelf: { ...data.shelf },
      progress: { ...(s.userBookshelves[userId]?.progress ?? {}), ...data.progress },
    };
  });
}
