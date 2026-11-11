import { getCurrentUser, json, sameOriginOrReject } from "@/lib/server/guard";
import { deleteReview, listReviews, upsertReview } from "@/lib/server/catalog";
import { z } from "zod";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  id: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional(),
  content: z.string().trim().min(5).max(3000),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const reviews = await listReviews(params.id);
  return json(reviews);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return json({ error: "You must be signed in to post a review." }, 401);
  if (user.isBanned) return json({ error: "Your account is not permitted to post reviews." }, 403);

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  if (!parsed.data.id) {
    const existing = await listReviews(params.id);
    if (existing.some((r) => r.userId === user.id)) {
      return json(
        { error: "You have already submitted a review for this book. Please edit your existing review instead." },
        409
      );
    }
  }

  try {
    const review = await upsertReview({
      id: parsed.data.id || `rev-${randomUUID()}`,
      bookId: params.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      rating: parsed.data.rating,
      title: parsed.data.title || undefined,
      content: parsed.data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return json(review, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not post review." }, 400);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return json({ error: "Authentication required." }, 401);

  const { searchParams } = new URL(req.url);
  const reviewId = searchParams.get("reviewId");
  if (!reviewId) return json({ error: "Review ID required." }, 400);

  const reviews = await listReviews(params.id);
  const target = reviews.find((r) => r.id === reviewId);
  if (!target) return json({ error: "Review not found." }, 404);

  if (target.userId !== user.id && user.role !== "admin") {
    return json({ error: "Not authorized to delete this review." }, 403);
  }

  await deleteReview(params.id, reviewId);
  return json({ success: true });
}
