/**
 * Process-local fixed-window rate limiter for public server functions.
 * Not a substitute for edge/WAF limits — stops casual scrape of occupancy/cab.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

type Bucket = { count: number; resetAt: number };

const g = globalThis as typeof globalThis & { __twRateLimit__?: Map<string, Bucket> };
if (!g.__twRateLimit__) g.__twRateLimit__ = new Map();

export type RateLimitOptions = {
  /** Max requests in the window. */
  limit: number;
  /** Window length in ms. */
  windowMs: number;
  now?: number;
};

/** Pure check/consume against an in-memory map keyed by `key`. */
export function consumeRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = opts.now ?? Date.now();
  const store = g.__twRateLimit__!;
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: Math.max(0, opts.limit - 1),
      resetAt,
      retryAfterSec: 0,
    };
  }
  if (existing.count >= opts.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  store.set(key, existing);
  return {
    ok: true,
    remaining: Math.max(0, opts.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSec: 0,
  };
}

/** Test helper — clears all buckets. */
export function resetRateLimitStore() {
  g.__twRateLimit__!.clear();
}

export function clientKeyFromHeaders(headers: Headers | { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "anon";
}
