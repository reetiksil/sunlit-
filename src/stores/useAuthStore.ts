import { create } from "zustand";
import type { User } from "@/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface RegisterResult {
  user: User;
  otpDeliveryMethod?: "smtp" | "resend" | "local";
  otpMessage?: string;
  otpError?: string;
}

interface AuthState {
  user: User | null;
  status: AuthStatus;
  /** Re-sync with the server session cookie (source of truth). */
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong. Please try again.");
  return data as T;
}

// Deliberately NOT persisted: the role lives in a signed httpOnly cookie, so editing
// localStorage can never change who you are. The store is only a cache of /api/auth/me.
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "loading",

  refresh: async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
      const data = (await res.json()) as { user: User | null };
      set({ user: data.user, status: data.user ? "authenticated" : "anonymous" });
    } catch {
      set({ user: null, status: "anonymous" });
    }
  },

  login: async (email, password) => {
    const { user } = await post<{ user: User }>("/api/auth/login", { email, password });
    set({ user, status: "authenticated" });
    return user;
  },

  register: async (name, email, password) => {
    const result = await post<RegisterResult>("/api/auth/register", { name, email, password });
    set({ user: result.user, status: "authenticated" });
    return result;
  },

  logout: async () => {
    try {
      await post("/api/auth/logout");
    } finally {
      set({ user: null, status: "anonymous" });
    }
  },
}));
