import { takeQuota } from "@/lib/ask-present";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";

export type StoredTurn = { question: string; answer: string };

type Mem = { hits: Map<string, number[]>; turns: Map<string, StoredTurn[]> };
const g = globalThis as typeof globalThis & { __twAskStore__?: Mem };
function memory(): Mem {
  if (!g.__twAskStore__) g.__twAskStore__ = { hits: new Map(), turns: new Map() };
  return g.__twAskStore__;
}

function threadKey(userId: string, confirmationCode: string) {
  return `${userId}\n${confirmationCode}`;
}

async function rpc<T>(op: string, payload: Record<string, unknown>): Promise<T | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.rpc("tw_ask", {
    p_gate: SUPABASE_WRITE_GATE,
    p_op: op,
    p_payload: payload,
  });
  if (error) throw new Error(error.message);
  return data as T;
}

/** Count this ask against the signed-in user. Uses the database when Supabase is on. */
export async function takeAskSlot(userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const data = await rpc<{ ok?: boolean }>("take", { user_id: userId });
      return data?.ok === true;
    } catch (err) {
      console.error("[ask] quota", err instanceof Error ? err.name : "failed");
    }
  }
  const mem = memory();
  const next = takeQuota(mem.hits.get(userId) ?? [], Date.now());
  mem.hits.set(userId, next.kept);
  return next.ok;
}

export async function listAskTurns(userId: string, confirmationCode: string): Promise<StoredTurn[]> {
  const code = confirmationCode.trim();
  if (!code) return [];
  if (isSupabaseConfigured()) {
    try {
      const data = await rpc<StoredTurn[]>("list", { user_id: userId, confirmation_code: code });
      if (Array.isArray(data)) {
        return data.filter((row) => typeof row?.question === "string" && typeof row?.answer === "string").slice(-20);
      }
    } catch (err) {
      console.error("[ask] list", err instanceof Error ? err.name : "failed");
    }
  }
  return memory().turns.get(threadKey(userId, code)) ?? [];
}

export async function appendAskTurn(
  userId: string,
  confirmationCode: string,
  question: string,
  answer: string,
): Promise<void> {
  const code = confirmationCode.trim();
  if (!code) return;
  const turn = { question: question.slice(0, 400), answer: answer.slice(0, 1200) };
  if (isSupabaseConfigured()) {
    try {
      await rpc("append", { user_id: userId, confirmation_code: code, question: turn.question, answer: turn.answer });
      return;
    } catch (err) {
      console.error("[ask] append", err instanceof Error ? err.name : "failed");
    }
  }
  const mem = memory();
  const key = threadKey(userId, code);
  const prev = mem.turns.get(key) ?? [];
  mem.turns.set(key, [...prev, turn].slice(-20));
}
