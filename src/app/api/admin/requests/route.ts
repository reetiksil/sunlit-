import { json, requireRole, sameOriginOrReject } from "@/lib/server/guard";
import { clearAllRequests, listBookRequests } from "@/lib/server/requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const requests = await listBookRequests();
  return json(requests);
}

export async function DELETE(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const onlyResolved = searchParams.get("onlyResolved") === "true";

  await clearAllRequests(onlyResolved);
  return json({ success: true });
}
