import { bookSchema } from "@/lib/catalogSchemas";
import { json, requireRole, sameOriginOrReject } from "@/lib/server/guard";
import { upsertBook } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const parsed = bookSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
  try {
    return json(await upsertBook(parsed.data));
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not save the book." }, 409);
  }
}
