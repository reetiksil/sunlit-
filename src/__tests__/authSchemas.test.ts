import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/authSchemas";
import { safeNextPath } from "@/lib/safeRedirect";

describe("auth schemas", () => {
  it("strips a client-supplied role from registration", () => {
    const parsed = registerSchema.parse({ name: "Sly", email: "SLY@example.com", password: "password123", role: "admin" });
    expect("role" in parsed).toBe(false);
    expect(parsed.email).toBe("sly@example.com");
  });

  it("enforces password length and email format", () => {
    expect(registerSchema.safeParse({ name: "Al", email: "a@b.co", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("only allows same-site relative paths", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
    expect(safeNextPath(null, "/x")).toBe("/x");
  });
});
