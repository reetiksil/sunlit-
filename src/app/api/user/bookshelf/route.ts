import { getCurrentUser, json, sameOriginOrReject } from "@/lib/server/guard";
import { getUserBookshelf, saveUserBookshelf } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ shelf: {}, progress: {} });

  const data = await getUserBookshelf(user.id);
  return json(data);
}

export async function PUT(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return json({ error: "Must be signed in to sync bookshelf." }, 401);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid payload." }, 400);

  const shelf = body.shelf && typeof body.shelf === "object" ? body.shelf : {};
  const progress = body.progress && typeof body.progress === "object" ? body.progress : {};

  await saveUserBookshelf(user.id, { shelf, progress });
  return json({ success: true });
}
