import { loginSchema } from "@/lib/authSchemas";
import { attachSession, json, sameOriginOrReject } from "@/lib/server/guard";
import {
  dummyVerify,
  ensureEnvAdmin,
  findUserByEmail,
  syncEnvAdmin,
  toPublicUser,
  updateUserPassword,
  verifyPassword,
} from "@/lib/server/users";
import { clientIp, rateLimit } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = sameOriginOrReject(req);
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);

  const { email, password } = parsed.data;
  if (!rateLimit(`login:${clientIp(req)}:${email}`, 8, 15 * 60 * 1000)) {
    return json({ error: "Too many attempts. Please wait a few minutes." }, 429);
  }

  // Ensure environment-configured admin account is initialized
  await ensureEnvAdmin();

  let found = await findUserByEmail(email);
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD;
  const isEnvAdmin = Boolean(adminEmail && email === adminEmail);

  let ok = false;
  if (found) {
    ok = await verifyPassword(password, found.passwordHash);
    // If credentials match the environment ADMIN_PASSWORD, sync the stored hash and grant access
    if (!ok && isEnvAdmin && adminPass && password === adminPass) {
      ok = true;
      await updateUserPassword(email, adminPass);
      found = await findUserByEmail(email);
    }
  } else if (isEnvAdmin && adminPass && password === adminPass) {
    found = await ensureEnvAdmin();
    ok = true;
  } else {
    ok = await dummyVerify(password);
  }

  if (!found || !ok) return json({ error: "Invalid email or password." }, 401);

  const user = await syncEnvAdmin(found);
  const publicUser = toPublicUser(user);
  const redirectUrl = user.role === "admin" ? "/admin" : null;

  return attachSession(json({ user: publicUser, redirectUrl }), user);
}
