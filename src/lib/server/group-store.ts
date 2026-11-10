import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";
import { applyEngine, type EngineResult, type GroupDoc } from "@/lib/group/engine";

type Mem = { byId: Map<string, GroupDoc>; byHash: Map<string, string> };
const g = globalThis as typeof globalThis & { __twGroups__?: Mem };

function memory(): Mem {
  if (!g.__twGroups__) g.__twGroups__ = { byId: new Map(), byHash: new Map() };
  return g.__twGroups__;
}

function clone(doc: GroupDoc): GroupDoc {
  return structuredClone(doc);
}

async function rpc<T>(op: string, payload: Record<string, unknown>): Promise<T> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("database");
  const { data, error } = await sb.rpc("tw_group", {
    p_gate: SUPABASE_WRITE_GATE,
    p_op: op,
    p_payload: payload,
  });
  if (error) throw new Error(error.message);
  return data as T;
}

export async function loadGroup(locator: { tokenHash?: string; tripId?: string }): Promise<GroupDoc | null> {
  if (!isSupabaseConfigured()) {
    const mem = memory();
    // Same order as tw_group('load'): a share token wins over a trip id.
    const id = locator.tokenHash ? mem.byHash.get(locator.tokenHash) : locator.tripId;
    const doc = id ? mem.byId.get(id) : undefined;
    return doc ? clone(doc) : null;
  }
  const data = await rpc<{ ok?: boolean; doc?: GroupDoc }>("load", {
    token_hash: locator.tokenHash ?? "",
    trip_id: locator.tripId ?? "",
  });
  return data?.doc ? clone(data.doc) : null;
}

async function persist(doc: GroupDoc, expected: number | null, event: string): Promise<{ ok: true } | { ok: false; error: string; doc?: GroupDoc }> {
  if (!isSupabaseConfigured()) {
    const mem = memory();
    const current = mem.byId.get(doc.trip.id);
    if (expected != null && current && current.trip.version !== expected) {
      return { ok: false, error: "version", doc: clone(current) };
    }
    mem.byId.set(doc.trip.id, clone(doc));
    mem.byHash.set(doc.trip.shareTokenHash, doc.trip.id);
    return { ok: true };
  }
  try {
    if (expected == null) {
      const data = await rpc<{ ok?: boolean; error?: string }>("create", { doc });
      if (data?.ok === false) return { ok: false, error: data.error ?? "create" };
      return { ok: true };
    }
    const data = await rpc<{ ok?: boolean; error?: string; doc?: GroupDoc; version?: number }>("save", {
      expected_version: expected,
      doc,
      event,
    });
    if (data?.ok === false) return { ok: false, error: data.error ?? "save", doc: data.doc };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "save" };
  }
}

/** Apply one op to the locked version. A stale write is retried against the saved document. */
export async function mutateGroup(
  locator: { tokenHash?: string; tripId?: string },
  op: string,
  payload: Record<string, unknown>,
  now = new Date(),
): Promise<EngineResult> {
  if (op === "create") {
    const created = applyEngine(null, "create", payload, now);
    if (!created.ok || !created.doc) return created;
    const saved = await persist(created.doc, null, "create");
    if (!saved.ok) return { ok: false, error: saved.error };
    return created;
  }
  let last: EngineResult = { ok: false, error: "missing" };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await loadGroup(locator);
    if (!current) return { ok: false, error: "missing" };
    const expected = current.trip.version;
    const next = applyEngine(current, op, { ...payload, expected_version: expected }, now);
    last = next;
    if (!next.ok && next.persist && next.doc) {
      // A refused step that still changed state (a wrong OTP guess) is saved before it is refused.
      const saved = await persist(next.doc, expected, op);
      if (saved.ok || saved.error !== "version") return { ok: false, error: next.error };
      continue;
    }
    if (!next.ok || !next.doc) return next;
    if (op === "get_state" || next.noop) return next;
    const saved = await persist(next.doc, expected, op);
    if (saved.ok) return next;
    if (saved.error !== "version") return { ok: false, error: saved.error, doc: saved.doc };
  }
  // Out of retries: nothing was saved, so never report the step as done.
  void last;
  return { ok: false, error: "version" };
}

export async function listOrganiserGroups(userId: string): Promise<{ tripId: string; title: string; status: string; checkIn: string; nights: number; version: number }[]> {
  if (!isSupabaseConfigured()) {
    return [...memory().byId.values()]
      .filter((doc) => doc.trip.organiserUserId === userId)
      .map((doc) => ({
        tripId: doc.trip.id,
        title: doc.trip.title,
        status: doc.trip.status,
        checkIn: doc.trip.checkIn,
        nights: doc.trip.nights,
        version: doc.trip.version,
      }));
  }
  const data = await rpc<unknown>("list_organiser", { organiser_user_id: userId });
  return Array.isArray(data) ? data : [];
}

export async function listDeskGroups(packageId: string): Promise<GroupDoc[]> {
  if (!isSupabaseConfigured()) {
    return [...memory().byId.values()].filter(
      (doc) =>
        doc.trip.lockedPackageId === packageId &&
        (doc.trip.status === "fully_paid_awaiting_hotel" || doc.trip.status === "hotel_confirmed"),
    );
  }
  const data = await rpc<GroupDoc[]>("list_desk", { package_id: packageId });
  return Array.isArray(data) ? data : [];
}

export async function listPendingGroupRefunds(): Promise<{ tripId: string; razorpayPaymentId: string; amountInr: number; refundId: string }[]> {
  if (isSupabaseConfigured()) {
    const rows = await rpc<{ tripId?: string; refund?: { id?: string; razorpay_payment_id?: string; amount_inr?: number; status?: string } }[]>("list_refunds", {});
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row) => row?.refund?.status === "pending" && (row.refund.amount_inr ?? 0) > 0 && row.refund.razorpay_payment_id && row.tripId && row.refund.id)
      .map((row) => ({
        tripId: row.tripId!,
        refundId: row.refund!.id!,
        razorpayPaymentId: row.refund!.razorpay_payment_id!,
        amountInr: row.refund!.amount_inr!,
      }));
  }
  const out: { tripId: string; razorpayPaymentId: string; amountInr: number; refundId: string }[] = [];
  for (const doc of memory().byId.values()) {
    for (const refund of doc.refunds) {
      if (refund.status === "pending" && refund.amountInr > 0) {
        out.push({
          tripId: doc.trip.id,
          refundId: refund.id,
          razorpayPaymentId: refund.razorpayPaymentId,
          amountInr: refund.amountInr,
        });
      }
    }
  }
  return out;
}

/** Version-checked and retried, so a concurrent group write cannot drop the "applied" mark. */
export async function markGroupRefund(tripId: string, refundId: string, status: "applied" | "failed") {
  return mutateGroup({ tripId }, "mark_refund", { refund_id: refundId, status });
}
