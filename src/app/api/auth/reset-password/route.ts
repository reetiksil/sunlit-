import { json, sameOriginOrReject } from "@/lib/server/guard";
import { verifyOtpCode } from "@/lib/server/otp";
import { updateUserPassword, findUserByEmail } from "@/lib/server/users";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const resetSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().length(6, "Verification code must be 6 digits."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  if (!rateLimit(`reset-pass:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return json({ error: "Too many attempts. Please try again later." }, 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  const { email, code, newPassword } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) return json({ error: "No account found for this email." }, 404);

  const verified = await verifyOtpCode(email, code, "admin-reset");
  if (!verified.ok) return json({ error: verified.error || "Invalid or expired code." }, 400);

  const updated = await updateUserPassword(email, newPassword);
  if (!updated) return json({ error: "Failed to update password." }, 500);

  return json({ ok: true, message: "Password updated successfully. You may now sign in." });
}
