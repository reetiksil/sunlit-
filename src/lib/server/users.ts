import { promises as fs } from "fs";
import path from "path";
import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "crypto";
import type { Role } from "@/lib/session";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  isVerified?: boolean;
  joinedAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  joinedAt: string;
}

export function toPublicUser(u: StoredUser): PublicUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role, isVerified: !!u.isVerified, joinedAt: u.joinedAt };
}

export function dataDir(): string {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), ".data");
}

const usersFile = () => path.join(dataDir(), "users.json");

/* ---------- password hashing (scrypt) ---------- */

function scrypt(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used to burn the same CPU time when the email is unknown (avoids user-enumeration by timing).
let dummyHashPromise: Promise<string> | null = null;
export function dummyVerify(password: string): Promise<boolean> {
  dummyHashPromise ??= hashPassword("not-a-real-password");
  return dummyHashPromise.then((h) => verifyPassword(password, h)).then(() => false);
}

/* ---------- file-backed store with serialized writes ---------- */

let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await fs.readFile(usersFile(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${usersFile()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(users, null, 2), { mode: 0o600 });
  await fs.rename(tmp, usersFile());
}

/** Emails listed in ADMIN_EMAILS (comma-separated) become admins. Never read from client input. */
export function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const users = await readUsers();
  return users.find((u) => u.email === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function listUsers(): Promise<PublicUser[]> {
  return (await readUsers()).map(toPublicUser);
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists.");
  }
}

export async function createUser(input: { name: string; email: string; password: string }): Promise<StoredUser> {
  const email = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);
  return serialize(async () => {
    const users = await readUsers();
    if (users.some((u) => u.email === email)) throw new DuplicateEmailError();
    const user: StoredUser = {
      id: randomUUID(),
      name: input.name,
      email,
      // The only place a role is assigned at creation: server-side, from env config.
      role: adminEmails().has(email) ? "admin" : "reader",
      passwordHash,
      isVerified: adminEmails().has(email),
      joinedAt: new Date().toISOString(),
    };
    await writeUsers([...users, user]);
    return user;
  });
}

/** Ensure predetermined admin from ADMIN_EMAIL / ADMIN_PASSWORD exists in the store. */
export async function ensureEnvAdmin(): Promise<StoredUser | null> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) return null;

  return serialize(async () => {
    const users = await readUsers();
    const existing = users.find((u) => u.email === adminEmail);
    if (existing) {
      if (existing.role !== "admin") {
        existing.role = "admin";
        existing.isVerified = true;
        await writeUsers(users);
      }
      return existing;
    }
    const passwordHash = await hashPassword(adminPass);
    const adminUser: StoredUser = {
      id: randomUUID(),
      name: process.env.ADMIN_NAME || "Head Curator",
      email: adminEmail,
      role: "admin",
      passwordHash,
      isVerified: true,
      joinedAt: new Date().toISOString(),
    };
    await writeUsers([...users, adminUser]);
    return adminUser;
  });
}

export async function markUserVerified(email: string): Promise<StoredUser | null> {
  const normalized = email.toLowerCase().trim();
  return serialize(async () => {
    const users = await readUsers();
    const idx = users.findIndex((u) => u.email === normalized);
    if (idx < 0) return null;
    users[idx].isVerified = true;
    await writeUsers(users);
    return users[idx];
  });
}

export async function updateUserPassword(email: string, newPass: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const passwordHash = await hashPassword(newPass);
  return serialize(async () => {
    const users = await readUsers();
    const idx = users.findIndex((u) => u.email === normalized);
    if (idx < 0) return false;
    users[idx].passwordHash = passwordHash;
    await writeUsers(users);
    return true;
  });
}

/** Create or promote an admin. Used by `npm run seed:admin` and nothing reachable from HTTP. */
export async function upsertAdmin(input: { name: string; email: string; password: string }): Promise<StoredUser> {
  const email = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);
  return serialize(async () => {
    const users = await readUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx >= 0) {
      users[idx] = { ...users[idx], role: "admin", passwordHash };
      await writeUsers(users);
      return users[idx];
    }
    const user: StoredUser = {
      id: randomUUID(),
      name: input.name,
      email,
      role: "admin",
      passwordHash,
      joinedAt: new Date().toISOString(),
    };
    await writeUsers([...users, user]);
    return user;
  });
}

/** Promote users whose email is in ADMIN_EMAILS (idempotent). Never demotes. */
export async function syncEnvAdmin(user: StoredUser): Promise<StoredUser> {
  if (user.role === "admin" || !adminEmails().has(user.email)) return user;
  return serialize(async () => {
    const users = await readUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx < 0) return user;
    users[idx] = { ...users[idx], role: "admin" };
    await writeUsers(users);
    return users[idx];
  });
}
