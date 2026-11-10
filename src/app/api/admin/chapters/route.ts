import { saveChapterSchema } from "@/lib/catalogSchemas";
import { json, requireRole, sameOriginOrReject } from "@/lib/server/guard";
import { deleteChapter, reorderChapters, saveChapter } from "@/lib/server/catalog";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const parsed = saveChapterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
  try {
    return json(await saveChapter(parsed.data.bookId, parsed.data.chapter));
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not save the chapter." }, 404);
  }
}

const deleteChapterSchema = z.object({
  bookId: z.string().min(1),
  chapterId: z.string().min(1),
});

export async function DELETE(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = deleteChapterSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
  try {
    await deleteChapter(parsed.data.bookId, parsed.data.chapterId);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not delete the chapter." }, 404);
  }
}

const reorderChaptersSchema = z.object({
  bookId: z.string().min(1),
  chapterIds: z.array(z.string().min(1)),
});

export async function PATCH(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = reorderChaptersSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
  try {
    const updated = await reorderChapters(parsed.data.bookId, parsed.data.chapterIds);
    return json(updated);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not reorder chapters." }, 404);
  }
}
