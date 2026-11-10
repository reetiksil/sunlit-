import { json, sameOriginOrReject } from "@/lib/server/guard";
import { verifyOtpCode } from "@/lib/server/otp";
import { markUserVerified } from "@/lib/server/users";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().length(6, "Code must be 6 digits."),
});

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  if (!rateLimit(`verify-reg:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return json({ error: "Too many attempts. Please try again later." }, 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  const { email, code } = parsed.data;
  const verified = await verifyOtpCode(email, code, "register-verify");
  if (!verified.ok) return json({ error: verified.error || "Invalid verification code." }, 400);

  await markUserVerified(email);
  return json({ ok: true, message: "Account successfully verified." });
}
