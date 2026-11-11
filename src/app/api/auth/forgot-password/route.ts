import { json, sameOriginOrReject } from "@/lib/server/guard";
import { createOtp, sendOtpEmail } from "@/lib/server/otp";
import { findUserByEmail, ensureEnvAdmin } from "@/lib/server/users";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  if (!rateLimit(`forgot-pass:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
    return json({ error: "Too many requests. Please wait a few minutes." }, 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  const email = parsed.data.email.toLowerCase();
  await ensureEnvAdmin();
  const user = await findUserByEmail(email);

  // For security, only allow password reset for accounts, but return generic success to prevent email enumeration
  if (user) {
    try {
      const { code } = await createOtp(email, "admin-reset");
      await sendOtpEmail(email, code, "admin-reset");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to dispatch verification code.";
      const status = message.toLowerCase().includes("too many") ? 429 : 500;
      return json({ error: message }, status);
    }
  }

  const hasEmailProvider = Boolean(
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) || process.env.RESEND_API_KEY
  );

  return json({
    ok: true,
    deliveryMethod: hasEmailProvider ? "email" : "local",
    message: hasEmailProvider
      ? "If an account matches that email, a 6-digit verification code has been dispatched."
      : "No email provider (SMTP/Resend) is configured in .env.local. If the account exists, the code was logged to the server terminal and .data/otp-log.json.",
  });
}
