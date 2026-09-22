import type { ReconcileJob, RefundIntent } from "@/lib/booking-memory";
import { mergeRefundIntents, putRefundIntent, upsertReconcileMemory } from "@/lib/booking-memory";
import { getSql } from "@/lib/db";
import { isDurableDbError, markDurableDbFailed, shouldSkipNeon } from "@/lib/server/db-fallback";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";

function messageOf(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return err instanceof Error ? err.message : String(err);
}

function asArray(value: unknown): Record<string, unknown>[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

function mapJob(row: Record<string, unknown>): ReconcileJob {
  const payload = row.payload;
  const state = row.state;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    paymentId: String(row.payment_id),
    orderId: row.order_id ? String(row.order_id) : null,
    attempts: Number(row.attempts ?? 0),
    lastError: row.last_error ? String(row.last_error) : undefined,
    payloadJson: typeof payload === "string" ? payload : JSON.stringify(payload ?? {}),
    state: state === "done" || state === "failed" || state === "refunded" ? state : "queued",
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at ?? row.created_at),
  };
}

function mapIntent(row: Record<string, unknown>): RefundIntent {
  const status = row.status;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    bookingId: Number(row.booking_id),
    paymentRef: String(row.payment_ref ?? ""),
    amountInr: Number(row.amount_inr ?? 0),
    status: status === "gateway_done" || status === "applied" ? status : "pending",
    refundId: row.refund_id ? String(row.refund_id) : undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at ?? row.created_at),
  };
}

function jobWire(job: ReconcileJob) {
  let payload: unknown = {};
  try {
    payload = JSON.parse(job.payloadJson);
  } catch {
    payload = {};
  }
  return {
    id: job.id,
    user_id: job.userId,
    payment_id: job.paymentId,
    order_id: job.orderId,
    attempts: job.attempts,
    last_error: job.lastError ?? null,
    payload,
    state: job.state,
    created_at: job.createdAt,
  };
}

function intentWire(intent: RefundIntent) {
  return {
    id: intent.id,
    user_id: intent.userId,
    booking_id: intent.bookingId,
    payment_ref: intent.paymentRef,
    amount_inr: intent.amountInr,
    status: intent.status,
    refund_id: intent.refundId ?? null,
    created_at: intent.createdAt,
  };
}

async function callSupabase(fn: string, payload: Record<string, unknown>): Promise<unknown> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase is not configured");
  const { data, error } = await sb.rpc(fn, { p_gate: SUPABASE_WRITE_GATE, p_payload: payload });
  if (error) throw new Error(error.message);
  return data;
}

const SQL_FNS = new Set([
  "tw_save_reconcile_job",
  "tw_list_reconcile_jobs",
  "tw_save_refund_intent",
  "tw_list_refund_intents",
]);

async function callSql(fn: string, payload: Record<string, unknown>): Promise<unknown> {
  if (!SQL_FNS.has(fn)) throw new Error("unknown ops function");
  const sql = await getSql();
  const rows = await sql.query<{ result: unknown }>(`select ${fn}($1::jsonb) as result`, [
    JSON.stringify(payload),
  ]);
  return rows[0]?.result;
}

async function writeOp(fn: string, payload: Record<string, unknown>): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await callSupabase(fn, payload);
      return true;
    } catch (err) {
      console.error("[payment-ops]", fn, messageOf(err));
      return false;
    }
  }
  if (shouldSkipNeon()) return false;
  try {
    await callSql(fn, payload);
    return true;
  } catch (err) {
    if (isDurableDbError(err)) markDurableDbFailed(err);
    console.error("[payment-ops]", fn, messageOf(err));
    return false;
  }
}

async function readOp(fn: string, payload: Record<string, unknown>): Promise<unknown | null> {
  if (isSupabaseConfigured()) {
    try {
      return await callSupabase(fn, payload);
    } catch (err) {
      console.error("[payment-ops]", fn, messageOf(err));
      return null;
    }
  }
  if (shouldSkipNeon()) return null;
  try {
    return await callSql(fn, payload);
  } catch (err) {
    if (isDurableDbError(err)) markDurableDbFailed(err);
    console.error("[payment-ops]", fn, messageOf(err));
    return null;
  }
}

export async function persistReconcileJob(job: ReconcileJob): Promise<boolean> {
  const stamped = { ...job, updatedAt: new Date().toISOString() };
  upsertReconcileMemory(stamped);
  return writeOp("tw_save_reconcile_job", jobWire(stamped));
}

export async function loadReconcileJobs(userId: string): Promise<ReconcileJob[] | null> {
  const data = await readOp("tw_list_reconcile_jobs", { user_id: userId });
  if (data == null) return null;
  try {
    return asArray(data).map(mapJob);
  } catch (err) {
    console.error("[payment-ops] list jobs", messageOf(err));
    return null;
  }
}

export async function persistRefundIntent(intent: RefundIntent): Promise<boolean> {
  const stamped = { ...intent, updatedAt: new Date().toISOString() };
  putRefundIntent(stamped);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await writeOp("tw_save_refund_intent", intentWire(stamped))) return true;
  }
  return false;
}

export async function loadRefundIntents(userId: string): Promise<RefundIntent[] | null> {
  const data = await readOp("tw_list_refund_intents", { user_id: userId });
  if (data == null) return null;
  try {
    return asArray(data).map(mapIntent);
  } catch (err) {
    console.error("[payment-ops] list intents", messageOf(err));
    return null;
  }
}

export async function hydrateRefundIntents(userId: string): Promise<void> {
  const rows = await loadRefundIntents(userId);
  if (rows) mergeRefundIntents(rows);
}
