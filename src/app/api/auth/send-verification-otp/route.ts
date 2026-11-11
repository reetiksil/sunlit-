import { json, sameOriginOrReject } from "@/lib/server/guard";
import { createOtp, sendOtpEmail } from "@/lib/server/otp";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email("Please provide a valid email address."),
});

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  if (!rateLimit(`send-verify:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return json({ error: "Too many requests. Please wait a few minutes." }, 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  const email = parsed.data.email.toLowerCase();
  try {
    const { code } = await createOtp(email, "register-verify");
    const result = await sendOtpEmail(email, code, "register-verify");
    return json({ ok: true, deliveryMethod: result.deliveryMethod, message: result.message });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to dispatch code.";
    const status = message.toLowerCase().includes("too many") ? 429 : 500;
    return json({ error: message }, status);
  }
}
