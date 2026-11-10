export type BookStatus = "ongoing" | "completed";

export type GenreSlug =
  | "fantasy"
  | "romance"
  | "sci-fi"
  | "slice-of-life"
  | "mystery"
  | "adventure"
  | "historical"
  | "cozy"
  | (string & {});

export interface Genre {
  id: string;
  slug: string;
  name: string;
  description: string;
  colorToken?: "sky" | "mint" | "blush" | "primary";
}

export interface CoverStyle {
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  motif: "sun" | "moon" | "leaf" | "waves" | "stars" | "arch";
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  blurb: string;
  description: string;
  status: BookStatus;
  genres: GenreSlug[];
  rating: number;
  views: number;
  featured?: boolean;
  weeklyRank?: number;
  updatedAt: string;
  createdAt: string;
  chapterCount: number;
  coverStyle: CoverStyle;
  coverImageUrl?: string;
  language?: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  content: string[];
  wordCount: number;
  publishedAt: string;
  status: "published" | "draft";
}

export type ReaderFontFamily =
  | "serif"
  | "sans"
  | "dyslexic"
  | "modern-serif"
  | "mono";

export type ReaderTheme = "day" | "sepia" | "paper" | "night" | "true-dark";
export type ReaderWidth = "narrow" | "medium" | "wide";
export type ReaderFontWeight = 400 | 600;

export interface ReaderSettings {
  fontSize: number; // 14 - 30px (see READER_LIMITS)
  fontFamily: ReaderFontFamily;
  fontWeight: ReaderFontWeight;
  lineHeight: number; // 1.4 - 2.2
  paragraphSpacing: number; // 0.75 - 2.0 rem
  textAlign: "left" | "justify";
  contentWidth: ReaderWidth;
  theme: ReaderTheme;
  readerMode: boolean; // distraction-free layout: hides site chrome
}

export type ShelfCategory = "reading" | "plan-to-read" | "completed";

export interface ReadingProgress {
  bookId: string;
  bookSlug: string;
  lastChapter: number;
  totalChapters: number;
  scrollPercentage: number;
  readChapters: number[];
  updatedAt: string;
}

export interface UploadedBook {
  id: string;
  title: string;
  author: string;
  format: "epub" | "pdf" | "txt";
  sizeBytes: number;
  fileBlob: ArrayBuffer;
  coverDataUrl?: string;
  progressPercentage: number;
  lastLocation: string; // EPUB CFI or PDF page number string
  addedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "reader" | "admin";
  isVerified?: boolean;
  isBanned?: boolean;
  joinedAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  author: string;
  note?: string;
  status: "pending" | "seen" | "fulfilled" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface BookFilterParams {
  query?: string;
  author?: string;
  genres?: GenreSlug[];
  status?: BookStatus | "all";
  sort?: "popular" | "newest" | "rating" | "az";
  page?: number;
  pageSize?: number;
}