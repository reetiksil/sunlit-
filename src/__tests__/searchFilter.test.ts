import { describe, it, expect } from "vitest";
import { filterAndSortBooks } from "@/services/api";
import { SEED_BOOKS } from "@/data/seed";

describe("Book Search and Filter Logic", () => {
  it("filters books by title or author query", () => {
    const res = filterAndSortBooks(SEED_BOOKS, { query: "Greenhouse" });
    expect(res.length).toBe(1);
    expect(res[0].title).toContain("Letters to the Greenhouse");
  });

  it("filters by multiple genres and completed status", () => {
    const res = filterAndSortBooks(SEED_BOOKS, {
      genres: ["slice-of-life"],
      status: "completed",
    });
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((b) => b.status === "completed" && b.genres.includes("slice-of-life"))).toBe(
      true
    );
  });

  it("sorts books alphabetically (A-Z)", () => {
    const res = filterAndSortBooks(SEED_BOOKS, { sort: "az" });
    expect(res[0].title.localeCompare(res[1].title)).toBeLessThanOrEqual(0);
  });
});