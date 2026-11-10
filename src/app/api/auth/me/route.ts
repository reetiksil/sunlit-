import { getCurrentUser, json } from "@/lib/server/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return json({ user: await getCurrentUser() });
}
