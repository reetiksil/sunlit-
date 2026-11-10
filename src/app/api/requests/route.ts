import { json, sameOriginOrReject, getCurrentUser } from "@/lib/server/guard";
import { createBookRequest, readRequests } from "@/lib/server/requests";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";
import { verifyOtpCode } from "@/lib/server/otp";
import { markUserVerified } from "@/lib/server/users";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({
  title: z.string().trim().min(1, "Book title is required.").max(200),
  author: z.string().trim().min(1, "Author name is required.").max(150),
  note: z.string().trim().max(1000).optional(),
  email: z.string().trim().email("Please enter a valid email address.").optional(),
  name: z.string().trim().max(100).optional(),
  otp: z.string().trim().regex(/^\d{6}$/, "Verification code must be 6 digits.").optional(),
});

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const ip = clientIp(req);
  const user = await getCurrentUser();

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  const { title, author, note, email, name, otp } = parsed.data;

  // 1. Authenticated User Flow
  if (user) {
    // If the authenticated user is already verified (or an admin), proceed immediately
    const isAlreadyVerified = Boolean(user.isVerified || user.role === "admin");

    if (!isAlreadyVerified) {
      if (!otp) {
        return json(
          {
            requiresVerification: true,
            email: user.email,
            error: "Please enter the 6-digit verification code sent to your email.",
          },
          403
        );
      }

      // Verify OTP code
      const verifyRes = await verifyOtpCode(user.email, otp, "book-request");
      if (!verifyRes.ok) {
        // Also check if register-verify code was used
        const fallbackRes = await verifyOtpCode(user.email, otp, "register-verify");
        if (!fallbackRes.ok) {
          return json({ error: verifyRes.error || "Invalid verification code." }, 400);
        }
      }

      // Mark user as verified in database
      await markUserVerified(user.email);
    }

    if (!rateLimit(`request:${ip}:${user.id}`, 5, 24 * 60 * 60 * 1000)) {
      return json({ error: "Rate limit reached. Please wait before requesting another book." }, 429);
    }

    try {
      const created = await createBookRequest({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        title,
        author,
        note,
      });
      return json(created, 201);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Failed to create request." }, 400);
    }
  }

  // 2. Unauthenticated / Guest User Flow
  if (!email) {
    return json({ error: "Email address is required to submit a book request." }, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit guests by IP and email
  if (!rateLimit(`request:${ip}:${normalizedEmail}`, 5, 24 * 60 * 60 * 1000)) {
    return json({ error: "Rate limit reached. Please wait before requesting another book." }, 429);
  }

  // Require OTP verification for unauthenticated users
  if (!otp) {
    return json(
      {
        requiresVerification: true,
        email: normalizedEmail,
        error: "Please enter the 6-digit verification code sent to your email.",
      },
      403
    );
  }

  const verifyRes = await verifyOtpCode(normalizedEmail, otp, "book-request");
  if (!verifyRes.ok) {
    return json({ error: verifyRes.error || "Invalid verification code." }, 400);
  }

  try {
    const created = await createBookRequest({
      userId: `guest:${normalizedEmail}`,
      userEmail: normalizedEmail,
      userName: name?.trim() || normalizedEmail.split("@")[0],
      title,
      author,
      note,
    });
    return json(created, 201);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to create request." }, 400);
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ error: "Authentication required." }, 401);

  const all = await readRequests();
  const userRequests = all.filter((r) => r.userId === user.id || r.userEmail === user.email);
  return json(userRequests);
}
