import { json, sameOriginOrReject, getCurrentUser } from "@/lib/server/guard";
import { createOtp, sendOtpEmail } from "@/lib/server/otp";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email("Please provide a valid email address.").optional(),
});

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const ip = clientIp(req);
  if (!rateLimit(`send-req-otp:${ip}`, 5, 10 * 60 * 1000)) {
    return json({ error: "Too many OTP requests. Please wait a few minutes." }, 429);
  }

  const user = await getCurrentUser();
  let targetEmail = user?.email;

  if (!targetEmail) {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success || !parsed.data.email) {
      return json({ error: "Email address is required." }, 400);
    }
    targetEmail = parsed.data.email.toLowerCase().trim();
  }

  try {
    const { code } = await createOtp(targetEmail, "book-request");
    const result = await sendOtpEmail(targetEmail, code, "book-request");
    return json({
      ok: true,
      email: targetEmail,
      deliveryMethod: result.deliveryMethod,
      message: result.message,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to dispatch verification code." }, 429);
  }
}
