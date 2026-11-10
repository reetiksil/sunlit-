import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}