// Small in-memory sliding-window limiter. Per-process only; use a shared store when scaling out.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t: number) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t: number) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
