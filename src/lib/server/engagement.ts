import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  Comment,
  CommentTargetType,
  ReactionSummary,
  ReactionTargetType,
  ReactionType,
} from "@/types";
import { dataDir } from "@/lib/server/users";

interface StoredComment {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

interface EngagementState {
  comments: Record<string, StoredComment[]>; // `${targetType}:${targetId}` -> StoredComment[]
  reactions: Record<string, Record<string, ReactionType>>; // `${targetType}:${targetId}` -> { userId -> "like" | "dislike" }
}

const MAX_COMMENTS_PER_TARGET = 1000;
const MAX_PENDING_OPS = 300;
const FLUSH_DEBOUNCE_MS = 120;

const engagementFile = () => path.join(dataDir(), "engagement.json");

let state: EngagementState | null = null;
let loadPromise: Promise<EngagementState> | null = null;
let mutationQueue: Promise<unknown> = Promise.resolve();
let pendingOps = 0;

let dirty = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let activeFlush: Promise<void> | null = null;

function targetKey(targetType: string, targetId: string): string {
  return `${targetType}:${targetId}`;
}

async function load(): Promise<EngagementState> {
  if (state) return state;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const raw = JSON.parse(await fs.readFile(engagementFile(), "utf8")) as Partial<EngagementState>;
      state = {
        comments: raw.comments && typeof raw.comments === "object" ? raw.comments : {},
        reactions: raw.reactions && typeof raw.reactions === "object" ? raw.reactions : {},
      };
    } catch {
      state = { comments: {}, reactions: {} };
    }
    return state;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

async function renameWithRetry(src: string, dest: string, attempts = 3): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await fs.rename(src, dest);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if ((code === "EPERM" || code === "EBUSY") && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 25 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

async function persistSnapshot(): Promise<void> {
  if (!state) return;
  const dir = dataDir();
  const target = engagementFile();
  const tmp = `${target}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`;

  try {
    await fs.mkdir(dir, { recursive: true });
    // Take a serialized JSON snapshot synchronously before async disk write
    const payload = JSON.stringify(state);
    await fs.writeFile(tmp, payload, "utf8");
    await renameWithRetry(tmp, target);
  } catch (err) {
    try {
      await fs.unlink(tmp);
    } catch {
      // ignore temp cleanup failure
    }
    console.error("[EngagementStore] Failed to persist snapshot:", err);
  }
}

function runFlushLoop(): Promise<void> {
  if (activeFlush) return activeFlush;

  activeFlush = (async () => {
    try {
      while (dirty) {
        dirty = false;
        await persistSnapshot();
      }
    } finally {
      activeFlush = null;
      if (dirty) {
        void runFlushLoop();
      }
    }
  })();

  return activeFlush;
}

function scheduleFlush(): void {
  dirty = true;
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void runFlushLoop();
  }, FLUSH_DEBOUNCE_MS);
}

/** Flush any coalesced pending writes to disk immediately (helpful for tests or shutdown). */
export async function flushEngagementStore(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  await runFlushLoop();
}

function mutate<T>(fn: (s: EngagementState) => T): Promise<T> {
  if (pendingOps >= MAX_PENDING_OPS) {
    return Promise.reject(new Error("Service is temporarily busy handling high traffic. Please retry in a moment."));
  }
  pendingOps++;

  const run = mutationQueue.then(async () => {
    const s = await load();
    const result = fn(s);
    scheduleFlush();
    return result;
  });

  mutationQueue = run.catch(() => undefined).finally(() => {
    pendingOps = Math.max(0, pendingOps - 1);
  });

  return run;
}

function computeSummary(
  map: Record<string, ReactionType> | undefined,
  currentUserId?: string | null
): ReactionSummary {
  if (!map) return { likeCount: 0, dislikeCount: 0, userReaction: null };
  let likeCount = 0;
  let dislikeCount = 0;
  for (const val of Object.values(map)) {
    if (val === "like") likeCount++;
    else if (val === "dislike") dislikeCount++;
  }
  const userReaction = currentUserId ? (map[currentUserId] ?? null) : null;
  return { likeCount, dislikeCount, userReaction };
}

/* ===================================================================== */
/* REACTIONS (LIKE / DISLIKE ON CHAPTERS, COMMENTS & REVIEWS)            */
/* ===================================================================== */

export async function getReactionSummary(
  targetType: ReactionTargetType,
  targetId: string,
  currentUserId?: string | null
): Promise<ReactionSummary> {
  const s = await load();
  const key = targetKey(targetType, targetId);
  return computeSummary(s.reactions[key], currentUserId);
}

export async function getReactionSummaries(
  targetType: ReactionTargetType,
  targetIds: string[],
  currentUserId?: string | null
): Promise<Record<string, ReactionSummary>> {
  const s = await load();
  const out: Record<string, ReactionSummary> = {};
  for (const id of targetIds) {
    out[id] = computeSummary(s.reactions[targetKey(targetType, id)], currentUserId);
  }
  return out;
}

export function toggleReaction(
  targetType: ReactionTargetType,
  targetId: string,
  userId: string,
  reaction: ReactionType
): Promise<ReactionSummary> {
  return mutate((s) => {
    const key = targetKey(targetType, targetId);
    if (!s.reactions[key]) s.reactions[key] = {};
    const userMap = s.reactions[key];

    if (userMap[userId] === reaction) {
      delete userMap[userId];
    } else {
      userMap[userId] = reaction;
    }

    if (Object.keys(userMap).length === 0) {
      delete s.reactions[key];
    }

    return computeSummary(s.reactions[key], userId);
  });
}

/* ===================================================================== */
/* COMMENTS (BOOKS & CHAPTERS)                                           */
/* ===================================================================== */

export async function listComments(
  targetType: CommentTargetType,
  targetId: string,
  currentUserId?: string | null,
  options?: { limit?: number; offset?: number }
): Promise<{ comments: Comment[]; total: number; hasMore: boolean }> {
  const s = await load();
  const key = targetKey(targetType, targetId);
  const stored = s.comments[key] ?? [];
  const total = stored.length;
  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 100);
  const offset = Math.max(options?.offset ?? 0, 0);

  const slice = stored.slice(offset, offset + limit);
  const enriched: Comment[] = slice.map((c) => {
    const summary = computeSummary(s.reactions[targetKey("comment", c.id)], currentUserId);
    return {
      ...c,
      ...summary,
    };
  });

  return {
    comments: enriched,
    total,
    hasMore: offset + slice.length < total,
  };
}

export function addComment(input: {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  userId: string;
  userName: string;
  content: string;
}): Promise<Comment> {
  return mutate((s) => {
    const key = targetKey(input.targetType, input.targetId);
    if (!s.comments[key]) s.comments[key] = [];

    const record: StoredComment = {
      id: input.id,
      targetType: input.targetType,
      targetId: input.targetId,
      userId: input.userId,
      userName: input.userName,
      content: input.content,
      createdAt: new Date().toISOString(),
    };

    const list = s.comments[key];
    list.unshift(record);

    // Prevent unbounded growth over prolonged traffic
    if (list.length > MAX_COMMENTS_PER_TARGET) {
      const removed = list.splice(MAX_COMMENTS_PER_TARGET);
      for (const old of removed) {
        delete s.reactions[targetKey("comment", old.id)];
      }
    }

    return {
      ...record,
      likeCount: 0,
      dislikeCount: 0,
      userReaction: null,
    };
  });
}

export function deleteComment(
  targetType: CommentTargetType,
  targetId: string,
  commentId: string,
  requesterId: string,
  isAdmin: boolean
): Promise<"deleted" | "not_found" | "forbidden"> {
  return mutate((s) => {
    const key = targetKey(targetType, targetId);
    const list = s.comments[key];
    if (!list) return "not_found";

    const idx = list.findIndex((c) => c.id === commentId);
    if (idx < 0) return "not_found";

    if (list[idx].userId !== requesterId && !isAdmin) {
      return "forbidden";
    }

    list.splice(idx, 1);
    delete s.reactions[targetKey("comment", commentId)];
    if (list.length === 0) {
      delete s.comments[key];
    }

    return "deleted";
  });
}

/** Reset cached in-memory state (used for isolated tests). */
export function _resetEngagementStoreForTests(): void {
  state = null;
  loadPromise = null;
  mutationQueue = Promise.resolve();
  pendingOps = 0;
  dirty = false;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}
