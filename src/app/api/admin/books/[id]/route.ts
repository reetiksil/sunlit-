import { json, requireRole, sameOriginOrReject } from "@/lib/server/guard";
import { deleteBook } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;
  await deleteBook(params.id);
  return json({ ok: true });
}
