import { clearSession, json, sameOriginOrReject } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;
  return clearSession(json({ ok: true }));
}
