import { promises as fs } from "fs";
import path from "path";
import { SEED_BOOKS, SEED_CHAPTERS } from "@/data/seed";
import type { Book, Chapter } from "@/types";
import { dataDir } from "@/lib/server/users";

interface CatalogState {
  books: Book[];
  chapters: Record<string, Chapter[]>;
}

const file = () => path.join(dataDir(), "catalog.json");
let state: CatalogState | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<CatalogState> {
  if (state) return state;
  try {
    state = JSON.parse(await fs.readFile(file(), "utf8")) as CatalogState;
  } catch {
    state = { books: structuredClone(SEED_BOOKS), chapters: structuredClone(SEED_CHAPTERS) };
  }
  return state;
}

async function persist(s: CatalogState) {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${file()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(s));
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
    const list = (s.chapters[bookId] ?? []).filter((c) => c.id !== chapterId);
    // Renumber remaining chapters sequentially
    list.forEach((c, idx) => {
      c.number = idx + 1;
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
    const map = new Map(currentList.map((c) => [c.id, c]));
    const reordered: Chapter[] = [];
    chapterIds.forEach((id, index) => {
      const ch = map.get(id);
      if (ch) {
        ch.number = index + 1;
        reordered.push(ch);
        map.delete(id);
      }
    });
    // Append any omitted chapters at the end
    for (const remaining of map.values()) {
      remaining.number = reordered.length + 1;
      reordered.push(remaining);
    }
    s.chapters[bookId] = reordered;
    book.chapterCount = reordered.length;
    book.updatedAt = new Date().toISOString();
    return reordered;
  });
}
