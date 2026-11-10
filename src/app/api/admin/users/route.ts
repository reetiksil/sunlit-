import { json, requireRole } from "@/lib/server/guard";
import { listUsers } from "@/lib/server/users";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;
  return json(await listUsers());
}
