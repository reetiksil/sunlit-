import { json, requireRole, sameOriginOrReject } from "@/lib/server/guard";
import { updateRequestStatus } from "@/lib/server/requests";
import { sendNotificationEmail } from "@/lib/server/otp";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["pending", "seen", "fulfilled", "rejected"]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;
  const auth = await requireRole("admin");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  try {
    const updated = await updateRequestStatus(params.id, parsed.data.status);
    // Optional notification when fulfilled
    if (parsed.data.status === "fulfilled" && updated.userEmail) {
      void sendNotificationEmail(
        updated.userEmail,
        `Sunlit Pages — "${updated.title}" is now available`,
        `Your requested book "${updated.title}" by ${updated.author} has been added to the Sunlit Pages library!`
      ).catch((err) => console.error("[BOOK REQUEST NOTIFY ERROR]", err));
    }
    return json(updated);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to update request." }, 404);
  }
}
