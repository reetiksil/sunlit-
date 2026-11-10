import { json, requireRole, sameOriginOrReject } from "@/lib/server/guard";
import { listBookRequests } from "@/lib/server/requests";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const requests = await listBookRequests();
  return json(requests);
}
