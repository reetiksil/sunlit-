import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getCurrentUser, json, sameOriginOrReject } from "@/lib/server/guard";
import { addComment, deleteComment, listComments } from "@/lib/server/engagement";
import { clientIp, rateLimitCheck } from "@/lib/server/rateLimit";
import type { CommentTargetType } from "@/types";

export const dynamic = "force-dynamic";

const createCommentSchema = z.object({
  targetType: z.enum(["book", "chapter"]),
  targetId: z.string().trim().min(1).max(120),
  content: z
    .string()
    .trim()
    .min(2, "Comment must be at least 2 characters.")
    .max(1500, "Comment must be 1,500 characters or fewer."),
});

function rateLimitResponse(message: string, retryAfterSec: number) {
  return NextResponse.json(
    { error: message, retryAfterSec },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType") as CommentTargetType | null;
  const targetId = searchParams.get("targetId")?.trim();

  if (!targetType || (targetType !== "book" && targetType !== "chapter") || !targetId) {
    return json({ error: "Valid targetType and targetId are required." }, 400);
  }

  const limitRaw = Number(searchParams.get("limit") ?? 25);
  const offsetRaw = Number(searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 25;
  const offset = Number.isFinite(offsetRaw) ? Math.max(Math.trunc(offsetRaw), 0) : 0;

  const user = await getCurrentUser();
  const data = await listComments(targetType, targetId, user?.id, { limit, offset });
  return json(data);
}

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) {
    return json({ error: "Only registered users can post comments. Please sign in or create an account." }, 401);
  }
  if (user.isBanned) {
    return json({ error: "Your account is not permitted to post comments." }, 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0].message }, 400);
  }

  // Enforce strict per-user cooldown + sliding window + IP flood protection
  const cooldown = rateLimitCheck(`comment-cd:${user.id}`, 1, 5_000);
  if (!cooldown.allowed) {
    return rateLimitResponse(
      `Please wait ${cooldown.retryAfterSec}s before posting another comment.`,
      cooldown.retryAfterSec
    );
  }

  const perMinute = rateLimitCheck(`comment-min:${user.id}`, 5, 60_000);
  if (!perMinute.allowed) {
    return rateLimitResponse(
      `Comment limit reached (max 5 comments per minute). Try again in ${perMinute.retryAfterSec}s.`,
      perMinute.retryAfterSec
    );
  }

  const ip = clientIp(req);
  const ipLimit = rateLimitCheck(`comment-ip:${ip}`, 25, 60_000);
  if (!ipLimit.allowed) {
    return rateLimitResponse(
      "Too many comments from this network right now. Please wait a moment.",
      ipLimit.retryAfterSec
    );
  }

  try {
    const comment = await addComment({
      id: `cmt-${randomUUID()}`,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      userId: user.id,
      userName: user.name,
      content: parsed.data.content,
    });
    return json(comment, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not post comment.";
    return json({ error: message }, message.includes("busy") ? 503 : 500);
  }
}

export async function DELETE(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) {
    return json({ error: "Authentication required." }, 401);
  }

  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType") as CommentTargetType | null;
  const targetId = searchParams.get("targetId")?.trim();
  const commentId = searchParams.get("commentId")?.trim();

  if (!targetType || (targetType !== "book" && targetType !== "chapter") || !targetId || !commentId) {
    return json({ error: "targetType, targetId, and commentId are required." }, 400);
  }

  const outcome = await deleteComment(
    targetType,
    targetId,
    commentId,
    user.id,
    user.role === "admin"
  );

  if (outcome === "not_found") return json({ error: "Comment not found." }, 404);
  if (outcome === "forbidden") return json({ error: "Not authorized to delete this comment." }, 403);
  return json({ ok: true });
}
