// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import {
  createUser,
  DuplicateEmailError,
  findUserByEmail,
  hashPassword,
  upsertAdmin,
  verifyPassword,
} from "@/lib/server/users";

describe("user store", () => {
  beforeEach(() => {
    process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), "sunlit-"));
    process.env.ADMIN_EMAILS = "boss@example.com";
  });

  it("hashes and verifies passwords", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });

  it("makes ordinary sign-ups readers and ADMIN_EMAILS sign-ups admins", async () => {
    const reader = await createUser({ name: "Rae", email: "Rae@Example.com", password: "password123" });
    const boss = await createUser({ name: "Boss", email: "boss@example.com", password: "password123" });
    expect(reader.role).toBe("reader");
    expect(reader.email).toBe("rae@example.com");
    expect(boss.role).toBe("admin");
  });

  it("ignores a role smuggled into the input", async () => {
    const sneaky = await createUser({ name: "Sly", email: "sly@example.com", password: "password123", role: "admin" } as never);
    expect(sneaky.role).toBe("reader");
  });

  it("rejects duplicate emails", async () => {
    await createUser({ name: "A", email: "dup@example.com", password: "password123" });
    let err: unknown = null;
    try {
      await createUser({ name: "B", email: "DUP@example.com", password: "password123" });
    } catch (e) {
      err = e;
    }
    expect(err instanceof DuplicateEmailError).toBe(true);
  });

  it("seeds and promotes admins", async () => {
    await createUser({ name: "Up", email: "up@example.com", password: "password123" });
    await upsertAdmin({ name: "Up", email: "up@example.com", password: "newpassword1" });
    const u = await findUserByEmail("up@example.com");
    expect(u?.role).toBe("admin");
    expect(await verifyPassword("newpassword1", u!.passwordHash)).toBe(true);
  });
});
