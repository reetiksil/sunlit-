import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession, type Role } from "@/lib/session";
import { findUserById, toPublicUser, type PublicUser, type StoredUser } from "@/lib/server/users";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Reject cross-site form posts: if an Origin header is present it must match the Host. */
export function sameOriginOrReject(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) return json({ error: "Cross-origin request blocked." }, 403);
  } catch {
    return json({ error: "Bad origin." }, 400);
  }
  return null;
}

export async function attachSession(res: NextResponse, user: StoredUser): Promise<NextResponse> {
  const token = await signSession({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

export function clearSession(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}

/** Resolve the current user from the signed cookie, re-reading the store so demotions/deletions apply at once. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const payload = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = await findUserById(payload.sub);
  return user ? toPublicUser(user) : null;
}

export async function requireRole(role: Role): Promise<{ user: PublicUser } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { error: json({ error: "Authentication required." }, 401) };
  if (role === "admin" && user.role !== "admin") return { error: json({ error: "Admin access required." }, 403) };
  return { user };
}
