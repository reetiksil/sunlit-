import { json, requireRole, sameOriginOrReject } from "@/lib/server/guard";
import { banUser, deleteUser } from "@/lib/server/users";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const isBanned = body && typeof body.isBanned === "boolean" ? body.isBanned : false;

  try {
    const updated = await banUser(params.id, isBanned);
    if (!updated) return json({ error: "User not found." }, 404);
    return json({ success: true, user: updated });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not update user." }, 400);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  try {
    const ok = await deleteUser(params.id);
    if (!ok) return json({ error: "User not found." }, 404);
    return json({ success: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not delete user." }, 400);
  }
}
