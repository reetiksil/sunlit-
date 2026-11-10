import { json } from "@/lib/server/guard";
import { listChapters } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const bookId = new URL(req.url).searchParams.get("bookId");
  if (!bookId) return json({ error: "bookId is required." }, 400);
  return json(await listChapters(bookId));
}
