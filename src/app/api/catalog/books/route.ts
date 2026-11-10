import { json } from "@/lib/server/guard";
import { listBooks } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return json(await listBooks());
}
