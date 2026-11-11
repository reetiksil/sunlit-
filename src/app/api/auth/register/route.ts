import { registerSchema } from "@/lib/authSchemas";
import { attachSession, json, sameOriginOrReject } from "@/lib/server/guard";
import { createUser, DuplicateEmailError, toPublicUser } from "@/lib/server/users";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { createOtp, sendOtpEmail } from "@/lib/server/otp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return json({ error: "Too many sign-ups from this address. Try again later." }, 429);
  }

  const body = await req.json().catch(() => null);
  // Unknown keys (e.g. "role") are stripped by zod, so a client can never choose its role.
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  try {
    const user = await createUser(parsed.data);
    // Dispatch initial registration verification code
    let otpDeliveryMethod: string | undefined;
    let otpMessage: string | undefined;
    let otpError: string | undefined;
    try {
      const { code } = await createOtp(user.email, "register-verify");
      const result = await sendOtpEmail(user.email, code, "register-verify");
      otpDeliveryMethod = result.deliveryMethod;
      otpMessage = result.message;
    } catch (otpErr) {
      otpError = otpErr instanceof Error ? otpErr.message : "Could not dispatch verification email.";
    }
    return attachSession(
      json({ user: toPublicUser(user), otpDeliveryMethod, otpMessage, otpError }, 201),
      user
    );
  } catch (err) {
    if (err instanceof DuplicateEmailError) return json({ error: err.message }, 409);
    console.error("register failed", err);
    return json({ error: "Could not create the account." }, 500);
  }
}
