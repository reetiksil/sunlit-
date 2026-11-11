import { describe, it, expect, beforeEach, afterAll } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import {
  _resetEngagementStoreForTests,
  addComment,
  deleteComment,
  flushEngagementStore,
  getReactionSummaries,
  getReactionSummary,
  listComments,
  toggleReaction,
} from "@/lib/server/engagement";
import { rateLimitCheck } from "@/lib/server/rateLimit";

const tempDir = path.join(os.tmpdir(), `sunlit-engagement-test-${Date.now()}`);

describe("Engagement Store (Comments, Likes/Dislikes, Concurrency & Rate Limits)", () => {
  beforeEach(async () => {
    process.env.DATA_DIR = tempDir;
    _resetEngagementStoreForTests();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    _resetEngagementStoreForTests();
    await fs.rm(tempDir, { recursive: true, force: true });
    delete process.env.DATA_DIR;
  });

  it("supports book and chapter comments with pagination", async () => {
    await addComment({
      id: "c1",
      targetType: "book",
      targetId: "book-1",
      userId: "u1",
      userName: "Alice",
      content: "First comment on this book!",
    });
    await addComment({
      id: "c2",
      targetType: "book",
      targetId: "book-1",
      userId: "u2",
      userName: "Bob",
      content: "Second comment on this book!",
    });
    await addComment({
      id: "c3",
      targetType: "chapter",
      targetId: "ch-1",
      userId: "u1",
      userName: "Alice",
      content: "Great chapter ending.",
    });

    const page1 = await listComments("book", "book-1", "u1", { limit: 1, offset: 0 });
    expect(page1.total).toBe(2);
    expect(page1.hasMore).toBe(true);
    expect(page1.comments).toHaveLength(1);
    expect(page1.comments[0].id).toBe("c2");

    const chList = await listComments("chapter", "ch-1");
    expect(chList.total).toBe(1);
    expect(chList.comments[0].content).toBe("Great chapter ending.");
  });

  it("handles like/dislike toggling and switching cleanly across chapters, comments, and reviews", async () => {
    // User 1 likes chapter 1
    let sum = await toggleReaction("chapter", "ch-1", "u1", "like");
    expect(sum).toEqual({ likeCount: 1, dislikeCount: 0, userReaction: "like" });

    // User 1 switches to dislike
    sum = await toggleReaction("chapter", "ch-1", "u1", "dislike");
    expect(sum).toEqual({ likeCount: 0, dislikeCount: 1, userReaction: "dislike" });

    // User 2 likes the same chapter
    const sumU2 = await toggleReaction("chapter", "ch-1", "u2", "like");
    expect(sumU2).toEqual({ likeCount: 1, dislikeCount: 1, userReaction: "like" });

    // Clicking like again removes user 2's like
    const sumRemoved = await toggleReaction("chapter", "ch-1", "u2", "like");
    expect(sumRemoved).toEqual({ likeCount: 0, dislikeCount: 1, userReaction: null });

    // Works on reviews & comments too
    await toggleReaction("review", "rev-1", "u1", "like");
    await toggleReaction("comment", "c1", "u1", "dislike");
    const reviewSummary = await getReactionSummary("review", "rev-1", "u1");
    expect(reviewSummary).toEqual({ likeCount: 1, dislikeCount: 0, userReaction: "like" });

    const batch = await getReactionSummaries("comment", ["c1", "missing"], "u1");
    expect(batch["c1"]).toEqual({ likeCount: 0, dislikeCount: 1, userReaction: "dislike" });
    expect(batch["missing"]).toEqual({ likeCount: 0, dislikeCount: 0, userReaction: null });
  });

  it("survives high concurrency burst of simultaneous comments and reactions without crashing or dropping writes", async () => {
    const commentJobs = Array.from({ length: 80 }, (_, idx) =>
      addComment({
        id: `burst-c-${idx}`,
        targetType: "book",
        targetId: "book-burst",
        userId: `user-${idx % 20}`,
        userName: `Reader ${idx % 20}`,
        content: `Concurrent comment payload #${idx}`,
      })
    );

    const reactionJobs = Array.from({ length: 80 }, (_, idx) =>
      toggleReaction("chapter", "ch-burst", `user-${idx}`, idx % 2 === 0 ? "like" : "dislike")
    );

    await Promise.all([...commentJobs, ...reactionJobs]);
    await flushEngagementStore();

    const stored = await listComments("book", "book-burst", null, { limit: 100, offset: 0 });
    expect(stored.total).toBe(80);
    expect(stored.comments).toHaveLength(80);

    const chSummary = await getReactionSummary("chapter", "ch-burst");
    expect(chSummary.likeCount).toBe(40);
    expect(chSummary.dislikeCount).toBe(40);
  });

  it("enforces owner/admin checks on delete and cleans up orphaned reactions", async () => {
    await addComment({
      id: "c-del",
      targetType: "book",
      targetId: "book-2",
      userId: "author-1",
      userName: "Author",
      content: "Comment to remove",
    });
    await toggleReaction("comment", "c-del", "user-x", "like");

    const forbidden = await deleteComment("book", "book-2", "c-del", "stranger", false);
    expect(forbidden).toBe("forbidden");

    const ok = await deleteComment("book", "book-2", "c-del", "author-1", false);
    expect(ok).toBe("deleted");

    const reactionsAfter = await getReactionSummary("comment", "c-del");
    expect(reactionsAfter.likeCount).toBe(0);
  });

  it("enforces comment rate limiting with retryAfter seconds", () => {
    const key = `test-limit-${Date.now()}`;
    expect(rateLimitCheck(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimitCheck(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimitCheck(key, 3, 60_000).allowed).toBe(true);

    const blocked = rateLimitCheck(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});
