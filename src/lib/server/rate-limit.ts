import { getRequest } from "@tanstack/react-start/server";

const buckets = new Map<string, { n: number; reset: number }>();

/** Per-IP window. A miss returns false so public catalog reads cannot be scraped in a loop. */
export function allowRequest(name: string, limit: number, windowMs: number): boolean {
  let ip = "local";
  try {
    const forwarded = getRequest().headers.get("x-forwarded-for");
    ip = forwarded?.split(",")[0]?.trim() || "local";
  } catch {
    ip = "local";
  }
  const key = `${name}:${ip}`;
  const now = Date.now();
  const row = buckets.get(key);
  if (!row || row.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  row.n += 1;
  return row.n <= limit;
}
