import { json, requireRole } from "@/lib/server/guard";
import { findUserById, toPublicUser } from "@/lib/server/users";
import { listUserReviews } from "@/lib/server/catalog";
import { listUserRequests } from "@/lib/server/requests";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const user = await findUserById(params.id);
  if (!user) return json({ error: "User not found." }, 404);

  const [reviews, requests] = await Promise.all([
    listUserReviews(user.id),
    listUserRequests(user.email),
  ]);

  return json({
    user: toPublicUser(user),
    reviews,
    requests,
  });
}
