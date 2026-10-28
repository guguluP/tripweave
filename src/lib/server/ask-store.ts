import { questionHasDocumentDigits, REDACTED_QUESTION } from "@/lib/arrival-ask";
import { takeQuota } from "@/lib/ask-present";
import { getSql } from "@/lib/db";
import { shouldSkipNeon } from "@/lib/server/db-fallback";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Ask TripWeave thread (last 20 turns per user + confirmation code) and the ask caps.
 *
 * Store, in order:
 * 1. Supabase `tw_ask` RPC (supabase/ask_turns.sql) when Supabase and its service key are
 *    configured (always in production when Supabase is on).
 * 2. Local Postgres `tw_ask` function (migrations/0014_ask_store.sql) when DATABASE_URL works.
 * 3. This process's memory (dev only), with the same 90-day expiry.
 *
 * When 1 or 2 is configured and the call fails, caps fail closed (deny) and nothing falls
 * back to per-instance memory.
 */

export type StoredTurn = { question: string; answer: string };

/** Mirrors the limits inside tw_ask (supabase/ask_turns.sql, migrations/0014_ask_store.sql). */
export const ASK_SLOT_LIMITS = {
  typed: { limit: 10, windowMs: 60 * 60_000 },
  suggest: { limit: 60, windowMs: 60 * 60_000 },
  car: { limit: 3, windowMs: 24 * 60 * 60_000 },
} as const;

export type AskSlotKind = keyof typeof ASK_SLOT_LIMITS;
export type SlotResult = "ok" | "limited" | "error";

export const TURN_TTL_MS = 90 * 24 * 60 * 60_000;
const MAX_TURNS = 20;

type MemTurn = StoredTurn & { at: number };
type Mem = { hits: Map<string, number[]>; turns: Map<string, MemTurn[]> };
const g = globalThis as typeof globalThis & { __twAskStore__?: Mem };
function memory(): Mem {
  if (!g.__twAskStore__) g.__twAskStore__ = { hits: new Map(), turns: new Map() };
  return g.__twAskStore__;
}

function threadKey(userId: string, confirmationCode: string) {
  return `${userId}\n${confirmationCode}`;
}

function bucketName(kind: AskSlotKind, scope = ""): string {
  return kind === "car" ? `car:${scope.trim().toUpperCase()}` : kind;
}

type Backend = "supabase" | "sql" | "memory";

export function askStoreBackend(): Backend {
  // Production always uses Supabase when it is on, so a missing key fails closed there.
  // Local dev with only the public Supabase URL (no service key) keeps working on memory.
  if (isSupabaseConfigured() && (isSupabaseAdminConfigured() || process.env.VERCEL_ENV === "production")) {
    return "supabase";
  }
  if (!shouldSkipNeon() && !process.env.VERCEL) return "sql";
  return "memory";
}

async function call<T>(op: string, payload: Record<string, unknown>): Promise<T | null> {
  const backend = askStoreBackend();
  if (backend === "supabase") {
    const sb = getSupabaseAdmin();
    if (!sb) throw new Error("supabase_unavailable");
    const { data, error } = await sb.rpc("tw_ask", { p_op: op, p_payload: payload });
    if (error) throw new Error(error.message);
    return data as T;
  }
  if (backend === "sql") {
    const sql = await getSql();
    const rows = await sql.query<{ result: unknown }>("select tw_ask($1, $2::jsonb) as result", [
      op,
      JSON.stringify(payload),
    ]);
    const result = rows[0]?.result;
    return (typeof result === "string" ? JSON.parse(result) : result) as T;
  }
  return null;
}

/** Drop memory turns older than 90 days. */
export function pruneMemoryTurns(now = Date.now()) {
  const mem = memory();
  for (const [key, rows] of mem.turns) {
    const kept = rows.filter((row) => now - row.at < TURN_TTL_MS);
    if (kept.length === 0) mem.turns.delete(key);
    else if (kept.length !== rows.length) mem.turns.set(key, kept);
  }
  for (const [key, hits] of mem.hits) {
    if (hits.every((at) => now - at > ASK_SLOT_LIMITS.car.windowMs)) mem.hits.delete(key);
  }
}

/**
 * Count one ask (or one airport-car request) against the signed-in user.
 * Count and insert are one atomic step in the database (advisory lock inside tw_ask).
 * Returns "error" when the durable store is configured but failed: the caller must deny.
 */
export async function takeAskSlot(userId: string, kind: AskSlotKind = "typed", scope = ""): Promise<SlotResult> {
  const bucket = bucketName(kind, scope);
  if (askStoreBackend() !== "memory") {
    try {
      const data = await call<{ ok?: boolean }>("take", { user_id: userId, bucket });
      return data?.ok === true ? "ok" : "limited";
    } catch (err) {
      console.error("[ask] quota", err instanceof Error ? err.message.slice(0, 120) : "failed");
      return "error";
    }
  }
  const mem = memory();
  const key = `${userId}\n${bucket}`;
  const { limit, windowMs } = ASK_SLOT_LIMITS[kind];
  const next = takeQuota(mem.hits.get(key) ?? [], Date.now(), limit, windowMs);
  mem.hits.set(key, next.kept);
  return next.ok ? "ok" : "limited";
}

export async function listAskTurns(userId: string, confirmationCode: string): Promise<StoredTurn[]> {
  const code = confirmationCode.trim();
  if (!code) return [];
  if (askStoreBackend() !== "memory") {
    try {
      const data = await call<StoredTurn[]>("list", { user_id: userId, confirmation_code: code });
      if (!Array.isArray(data)) return [];
      return data
        .filter((row) => typeof row?.question === "string" && typeof row?.answer === "string")
        .map((row) => ({ question: row.question, answer: row.answer }))
        .slice(-MAX_TURNS);
    } catch (err) {
      console.error("[ask] list", err instanceof Error ? err.message.slice(0, 120) : "failed");
      return [];
    }
  }
  pruneMemoryTurns();
  return (memory().turns.get(threadKey(userId, code)) ?? []).map(({ question, answer }) => ({ question, answer }));
}

/** The question as it may be stored. A question that looks like a document number never is. */
export function storableQuestion(question: string): string {
  const text = question.slice(0, 400);
  return questionHasDocumentDigits(text) ? REDACTED_QUESTION : text;
}

/** Save one turn. The caller must have checked that this user owns the booking. */
export async function appendAskTurn(
  userId: string,
  confirmationCode: string,
  question: string,
  answer: string,
): Promise<boolean> {
  const code = confirmationCode.trim();
  if (!code) return false;
  const turn = { question: storableQuestion(question), answer: answer.slice(0, 1200) };
  if (askStoreBackend() !== "memory") {
    try {
      await call("append", { user_id: userId, confirmation_code: code, question: turn.question, answer: turn.answer });
      return true;
    } catch (err) {
      console.error("[ask] append", err instanceof Error ? err.message.slice(0, 120) : "failed");
      return false;
    }
  }
  const mem = memory();
  const key = threadKey(userId, code);
  pruneMemoryTurns();
  const prev = mem.turns.get(key) ?? [];
  mem.turns.set(key, [...prev, { ...turn, at: Date.now() }].slice(-MAX_TURNS));
  return true;
}

/** Delete one booking's thread (stay cancelled or refunded). Database triggers also do this. */
export async function forgetAskThread(userId: string, confirmationCode: string): Promise<void> {
  const code = confirmationCode.trim();
  if (!userId || !code) return;
  memory().turns.delete(threadKey(userId, code));
  if (askStoreBackend() === "memory") return;
  try {
    await call("forget", { user_id: userId, confirmation_code: code });
  } catch (err) {
    console.error("[ask] forget", err instanceof Error ? err.message.slice(0, 120) : "failed");
  }
}

/** Delete every thread and cap row for a user (account deleted). Database triggers also do this. */
export async function forgetAskUser(userId: string): Promise<void> {
  if (!userId) return;
  const mem = memory();
  for (const key of [...mem.turns.keys()]) if (key.startsWith(`${userId}\n`)) mem.turns.delete(key);
  for (const key of [...mem.hits.keys()]) if (key.startsWith(`${userId}\n`)) mem.hits.delete(key);
  if (askStoreBackend() === "memory") return;
  try {
    await call("forget_user", { user_id: userId });
  } catch (err) {
    console.error("[ask] forget user", err instanceof Error ? err.message.slice(0, 120) : "failed");
  }
}
