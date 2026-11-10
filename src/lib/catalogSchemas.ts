import { z } from "zod";

const genreSlug = z.enum(["fantasy", "romance", "sci-fi", "slice-of-life", "mystery", "adventure", "historical", "cozy"]);
const isoDate = z.string().min(1).max(40);

export const bookSchema = z.object({
  id: z.string().min(1).max(80),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, digits and hyphens."),
  title: z.string().trim().min(1).max(160),
  author: z.string().trim().min(1).max(120),
  blurb: z.string().max(400),
  description: z.string().max(4000),
  status: z.enum(["ongoing", "completed"]),
  genres: z.array(genreSlug).max(8),
  rating: z.number().min(0).max(5),
  views: z.number().int().min(0),
  featured: z.boolean().optional(),
  weeklyRank: z.number().int().optional(),
  updatedAt: isoDate,
  createdAt: isoDate,
  chapterCount: z.number().int().min(0).max(10000),
  coverStyle: z.object({
    gradientFrom: z.string().max(20),
    gradientTo: z.string().max(20),
    accentColor: z.string().max(20),
    motif: z.enum(["sun", "moon", "leaf", "waves", "stars", "arch"]),
  }),
  coverImageUrl: z.string().url().or(z.string().startsWith("data:image/")).optional(),
  language: z.string().max(40).optional(),
});

export const chapterSchema = z.object({
  id: z.string().min(1).max(80),
  bookId: z.string().min(1).max(80),
  number: z.number().int().min(1).max(10000),
  title: z.string().trim().min(1).max(200),
  content: z.array(z.string().max(20000)).max(2000),
  wordCount: z.number().int().min(0),
  publishedAt: isoDate,
  status: z.enum(["published", "draft"]),
});

export const saveChapterSchema = z.object({ bookId: z.string().min(1), chapter: chapterSchema });
