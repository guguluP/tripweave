/**
 * Detect a dead DATABASE_URL (wrong Neon/Supabase pooler password, etc.).
 * Auth already skips DATABASE_URL on Vercel for this reason; bookings must too.
 */

const g = globalThis as typeof globalThis & {
  __twDurableDbFailed__?: boolean;
};

export function isDurableDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /password authentication failed|28P01|SASL|no pg_hba.conf|ECONNREFUSED|ENOTFOUND|timeout expired|Connection terminated/i.test(
    msg,
  );
}

export function markDurableDbFailed(err?: unknown): void {
  g.__twDurableDbFailed__ = true;
  if (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[db] durable postgres unavailable; using local store:", msg);
  }
}

export function durableDbFailed(): boolean {
  return Boolean(g.__twDurableDbFailed__);
}

/** Skip Neon on Vercel — the pooler password 500s (see auth/server.ts). Prefer Supabase REST. */
export function shouldSkipNeon(): boolean {
  if (durableDbFailed()) return true;
  if (process.env.VERCEL && !process.env.SUPABASE_URL?.trim()) return true;
  return !process.env.DATABASE_URL?.trim();
}

export function publicPersistError(err: unknown, fallback: string): string {
  if (isDurableDbError(err)) return fallback;
  const msg = err instanceof Error ? err.message.trim() : "";
  return msg || fallback;
}
