import { z } from "zod";
import { getCurrentUser, json, sameOriginOrReject } from "@/lib/server/guard";
import { getReactionSummary, toggleReaction } from "@/lib/server/engagement";
import { clientIp, rateLimitCheck } from "@/lib/server/rateLimit";
import type { ReactionTargetType } from "@/types";

export const dynamic = "force-dynamic";

const reactionSchema = z.object({
  targetType: z.enum(["chapter", "comment", "review"]),
  targetId: z.string().trim().min(1).max(120),
  reaction: z.enum(["like", "dislike"]),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType") as ReactionTargetType | null;
  const targetId = searchParams.get("targetId")?.trim();

  if (
    !targetType ||
    (targetType !== "chapter" && targetType !== "comment" && targetType !== "review") ||
    !targetId
  ) {
    return json({ error: "Valid targetType and targetId are required." }, 400);
  }

  const user = await getCurrentUser();
  const summary = await getReactionSummary(targetType, targetId, user?.id);
  return json(summary);
}

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) {
    return json({ error: "Please register or sign in to like or dislike." }, 401);
  }
  if (user.isBanned) {
    return json({ error: "Your account is not permitted to perform this action." }, 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0].message }, 400);
  }

  const userLimit = rateLimitCheck(`react:${user.id}`, 45, 60_000);
  if (!userLimit.allowed) {
    return json({ error: "You are reacting too quickly. Please pause for a moment." }, 429);
  }

  const ipLimit = rateLimitCheck(`react-ip:${clientIp(req)}`, 90, 60_000);
  if (!ipLimit.allowed) {
    return json({ error: "Too many reaction requests right now." }, 429);
  }

  try {
    const summary = await toggleReaction(
      parsed.data.targetType,
      parsed.data.targetId,
      user.id,
      parsed.data.reaction
    );
    return json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update reaction.";
    return json({ error: message }, message.includes("busy") ? 503 : 500);
  }
}
