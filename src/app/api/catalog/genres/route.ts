import { json, requireRole, sameOriginOrReject } from "@/lib/server/guard";
import { createGenre, deleteGenre, listGenres } from "@/lib/server/catalog";
import { z } from "zod";

export const dynamic = "force-dynamic";

const genreInputSchema = z.object({
  name: z.string().trim().min(2).max(40),
  slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens."),
  description: z.string().trim().min(5).max(160),
  colorToken: z.enum(["sky", "mint", "blush", "primary"]),
});

export async function GET() {
  const genres = await listGenres();
  return json(genres);
}

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = genreInputSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  try {
    const genre = await createGenre({
      id: `g-${Date.now()}`,
      slug: parsed.data.slug.toLowerCase(),
      name: parsed.data.name,
      description: parsed.data.description,
      colorToken: parsed.data.colorToken,
    });
    return json(genre, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Could not create genre." }, 400);
  }
}

export async function DELETE(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  if (!slug) return json({ error: "Genre slug or ID is required." }, 400);

  await deleteGenre(slug);
  return json({ ok: true });
}
