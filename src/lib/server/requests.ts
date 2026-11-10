import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { dataDir } from "@/lib/server/users";
import type { BookRequest } from "@/types";

const requestsFile = () => path.join(dataDir(), "requests.json");
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export async function readRequests(): Promise<BookRequest[]> {
  try {
    const raw = await fs.readFile(requestsFile(), "utf8");
    return JSON.parse(raw) as BookRequest[];
  } catch {
    return [];
  }
}

async function writeRequests(reqs: BookRequest[]): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  const tmp = `${requestsFile()}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(reqs, null, 2));
  await fs.rename(tmp, requestsFile());
}

export async function listBookRequests(): Promise<BookRequest[]> {
  const list = await readRequests();
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createBookRequest(input: {
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  author: string;
  note?: string;
}): Promise<BookRequest> {
  return serialize(async () => {
    const list = await readRequests();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const normEmail = input.userEmail.toLowerCase().trim();
    const normTitle = input.title.toLowerCase().trim();
    const normAuthor = input.author.toLowerCase().trim();

    const userRecent = list.filter(
      (r) =>
        (r.userId === input.userId || r.userEmail.toLowerCase() === normEmail) &&
        new Date(r.createdAt).getTime() > oneDayAgo
    );
    if (userRecent.length >= 5) {
      throw new Error("You have reached the maximum of 5 book requests per day.");
    }

    const existingPending = list.find(
      (r) =>
        r.userEmail.toLowerCase() === normEmail &&
        r.title.toLowerCase().trim() === normTitle &&
        r.author.toLowerCase().trim() === normAuthor &&
        r.status === "pending"
    );
    if (existingPending) {
      throw new Error("You already have a pending request for this title and author.");
    }

    const now = new Date().toISOString();
    const newReq: BookRequest = {
      id: `req-${randomUUID()}`,
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      title: input.title.trim(),
      author: input.author.trim(),
      note: input.note?.trim() || undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await writeRequests([newReq, ...list]);
    return newReq;
  });
}

export async function updateRequestStatus(
  id: string,
  status: "pending" | "seen" | "fulfilled" | "rejected"
): Promise<BookRequest> {
  return serialize(async () => {
    const list = await readRequests();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error("Request not found.");

    list[idx] = {
      ...list[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    await writeRequests(list);
    return list[idx];
  });
}

export async function clearAllRequests(onlyResolved: boolean = false): Promise<void> {
  return serialize(async () => {
    if (onlyResolved) {
      const list = await readRequests();
      const pending = list.filter((r) => r.status === "pending" || r.status === "seen");
      await writeRequests(pending);
    } else {
      await writeRequests([]);
    }
  });
}

export async function listUserRequests(userIdOrEmail: string): Promise<BookRequest[]> {
  const list = await readRequests();
  const norm = userIdOrEmail.toLowerCase().trim();
  return list.filter((r) => r.userId === userIdOrEmail || r.userEmail.toLowerCase() === norm);
}
