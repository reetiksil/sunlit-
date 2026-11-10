// @vitest-environment node
import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "@/lib/session";

const SECRET = "x".repeat(40);
const future = () => Math.floor(Date.now() / 1000) + 600;

describe("session tokens", () => {
  it("round-trips a valid token", async () => {
    const token = await signSession({ sub: "u1", role: "reader", exp: future() }, SECRET);
    const payload = await verifySession(token, SECRET);
    expect(payload?.sub).toBe("u1");
    expect(payload?.role).toBe("reader");
  });

  it("rejects a token whose role was edited (client cannot self-promote)", async () => {
    const token = await signSession({ sub: "u1", role: "reader", exp: future() }, SECRET);
    const [, sig] = token.split(".");
    const forgedBody = btoa(JSON.stringify({ sub: "u1", role: "admin", exp: future() }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(await verifySession(`${forgedBody}.${sig}`, SECRET)).toBeNull();
  });

  it("rejects tokens signed with another secret, expired tokens and garbage", async () => {
    const other = await signSession({ sub: "u1", role: "admin", exp: future() }, "y".repeat(40));
    expect(await verifySession(other, SECRET)).toBeNull();
    const expired = await signSession({ sub: "u1", role: "admin", exp: Math.floor(Date.now() / 1000) - 5 }, SECRET);
    expect(await verifySession(expired, SECRET)).toBeNull();
    expect(await verifySession("not-a-token", SECRET)).toBeNull();
    expect(await verifySession(undefined, SECRET)).toBeNull();
  });
});
