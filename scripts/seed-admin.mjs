#!/usr/bin/env node
// Creates (or promotes + resets the password of) an admin account directly in the server-side user store.
// This is the only way, besides the ADMIN_EMAILS env var, to create an admin. It is never reachable over HTTP.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long passphrase' npm run seed:admin
//   (or put the same variables in .env.local)
import { promises as fs, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import readline from "node:readline/promises";

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith("#")) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const hash = (password) =>
  new Promise((resolve, reject) => {
    const salt = randomBytes(16);
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) =>
      err ? reject(err) : resolve(`scrypt$${salt.toString("hex")}$${key.toString("hex")}`)
    );
  });

async function ask(question, fallback) {
  if (fallback) return fallback;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(question)).trim();
  rl.close();
  return answer;
}

const email = (await ask("Admin email: ", process.env.ADMIN_EMAIL)).toLowerCase();
const name = (await ask("Display name: ", process.env.ADMIN_NAME || "Curator")) || "Curator";
const password = await ask("Password (min 8 chars, visible as you type): ", process.env.ADMIN_PASSWORD);

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("A valid ADMIN_EMAIL is required.");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const dir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), ".data");
const file = path.join(dir, "users.json");
await fs.mkdir(dir, { recursive: true });

let users = [];
try {
  users = JSON.parse(await fs.readFile(file, "utf8"));
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

const passwordHash = await hash(password);
const idx = users.findIndex((u) => u.email === email);
if (idx >= 0) {
  users[idx] = { ...users[idx], role: "admin", isVerified: true, passwordHash };
  console.log(`Promoted existing user ${email} to admin and reset the password.`);
} else {
  users.push({ id: randomUUID(), name, email, role: "admin", isVerified: true, passwordHash, joinedAt: new Date().toISOString() });
  console.log(`Created admin ${email}.`);
}

const tmp = `${file}.${process.pid}.tmp`;
await fs.writeFile(tmp, JSON.stringify(users, null, 2), { mode: 0o600 });
await fs.rename(tmp, file);
console.log(`Saved to ${file}`);
