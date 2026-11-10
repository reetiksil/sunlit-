// Edge-safe session tokens (Web Crypto only) so the same code runs in middleware and route handlers.
export const SESSION_COOKIE = "sunlit_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Role = "reader" | "admin";

export interface SessionPayload {
  sub: string; // user id
  role: Role;
  exp: number; // unix seconds
}

const DEV_FALLBACK_SECRET = "sunlit-dev-only-secret-do-not-use-in-production";

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters in production.");
  }
  return DEV_FALLBACK_SECRET;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): ArrayBuffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer as ArrayBuffer;
}

async function hmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function signSession(payload: SessionPayload, secret = getAuthSecret()): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(
  token: string | undefined | null,
  secret = getAuthSecret()
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  try {
    // subtle.verify compares in constant time.
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret, "verify"),
      fromBase64Url(sig),
      encoder.encode(body)
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (typeof payload.sub !== "string" || (payload.role !== "reader" && payload.role !== "admin")) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
