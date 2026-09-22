import type { BookingRow } from "@/lib/server/bookings";

/**
 * Process-local cache. Bookings are keyed by user id.
 * Refund intents and reconcile jobs are written through to Postgres as well;
 * a cold start reloads those rows. Confirmation codes are desk labels, not logins.
 */
type MemoryState = {
  byUser: Map<string, BookingRow[]>;
  nextId: number;
};

export type RefundIntent = {
  id: string;
  userId: string;
  bookingId: number;
  paymentRef: string;
  amountInr: number;
  /** pending: about to call the gateway. gateway_done: money moved, status update still owed. applied: booking row matches. */
  status: "pending" | "gateway_done" | "applied";
  refundId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReconcileJob = {
  id: string;
  userId: string;
  paymentId: string;
  orderId: string | null;
  attempts: number;
  lastError?: string;
  createdAt: string;
  /** Serialized insert payload so a later pass can retry without the request. */
  payloadJson: string;
  state: "queued" | "done" | "failed" | "refunded";
  updatedAt: string;
};

type Globals = typeof globalThis & {
  __twBookingMemory__?: MemoryState;
  __twRefundIntents__?: Map<string, RefundIntent>;
  __twReconcileJobs__?: ReconcileJob[];
  /** Legacy unscoped array from older builds. Migrated once, then dropped. */
  __twMemoryBookings__?: BookingRow[] | Map<string, BookingRow[]>;
  __twMemoryId__?: number;
};

function state(): MemoryState {
  const g = globalThis as Globals;
  if (!g.__twBookingMemory__) {
    const byUser = new Map<string, BookingRow[]>();
    const legacy = g.__twMemoryBookings__;
    if (Array.isArray(legacy)) {
      for (const row of legacy) {
        const userId = row.userId || "";
        const bucket = byUser.get(userId) ?? [];
        bucket.push(row);
        byUser.set(userId, bucket);
      }
    }
    g.__twBookingMemory__ = {
      byUser,
      nextId: g.__twMemoryId__ ?? 1,
    };
    g.__twMemoryBookings__ = undefined;
  }
  return g.__twBookingMemory__;
}

function intentKey(userId: string, bookingId: number) {
  return `${userId}:${bookingId}`;
}

export function memoryBookingsFor(userId: string): BookingRow[] {
  return [...(state().byUser.get(userId) ?? [])];
}

export function memoryInsertBooking(
  input: Omit<BookingRow, "id" | "createdAt"> & { createdAt?: string },
): BookingRow {
  const mem = state();
  const booking: BookingRow = {
    ...input,
    id: mem.nextId++,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  const userId = booking.userId || "";
  const bucket = mem.byUser.get(userId) ?? [];
  mem.byUser.set(userId, [booking, ...bucket]);
  return booking;
}

export function memoryUpdateBooking(
  userId: string,
  id: number,
  patch: Partial<BookingRow>,
): BookingRow | null {
  const mem = state();
  const bucket = mem.byUser.get(userId) ?? [];
  let updated: BookingRow | null = null;
  const next = bucket.map((row) => {
    if (row.id !== id) return row;
    updated = { ...row, ...patch };
    return updated;
  });
  mem.byUser.set(userId, next);
  return updated;
}

function intents(): Map<string, RefundIntent> {
  const g = globalThis as Globals;
  if (!g.__twRefundIntents__) g.__twRefundIntents__ = new Map();
  return g.__twRefundIntents__;
}

export function putRefundIntent(intent: RefundIntent) {
  const stamped = { ...intent, updatedAt: intent.updatedAt || new Date().toISOString() };
  intents().set(intentKey(stamped.userId, stamped.bookingId), stamped);
}

/** Database rows fill a cold process. A newer in-memory intent wins. */
export function mergeRefundIntents(rows: RefundIntent[]) {
  for (const row of rows) {
    const local = refundIntentFor(row.userId, row.bookingId);
    const localAt = Date.parse(local?.updatedAt ?? "");
    const rowAt = Date.parse(row.updatedAt);
    if (local && Number.isFinite(localAt) && localAt > rowAt) continue;
    putRefundIntent(row);
  }
}

export function refundIntentFor(userId: string, bookingId: number): RefundIntent | undefined {
  return intents().get(intentKey(userId, bookingId));
}

export function listRefundIntents(userId: string): RefundIntent[] {
  return [...intents().values()].filter((row) => row.userId === userId);
}

function jobs(): ReconcileJob[] {
  const g = globalThis as Globals;
  if (!g.__twReconcileJobs__) g.__twReconcileJobs__ = [];
  return g.__twReconcileJobs__;
}

export function upsertReconcileMemory(job: ReconcileJob) {
  const queue = jobs();
  const index = queue.findIndex(
    (row) => row.id === job.id || (row.paymentId === job.paymentId && row.userId === job.userId),
  );
  if (index < 0) {
    queue.push(job);
    return job;
  }
  queue[index] = { ...queue[index]!, ...job };
  return queue[index]!;
}

/** Database rows fill a cold process. A newer in-memory job wins. */
export function mergeReconcileJobs(rows: ReconcileJob[]) {
  for (const row of rows) {
    const local = jobs().find((item) => item.id === row.id);
    const localAt = Date.parse(local?.updatedAt ?? "");
    const rowAt = Date.parse(row.updatedAt);
    if (local && Number.isFinite(localAt) && localAt > rowAt) continue;
    upsertReconcileMemory(row);
  }
}

export function enqueueReconcileJob(job: ReconcileJob) {
  const queue = jobs();
  const existing = queue.find((row) => row.paymentId === job.paymentId && row.userId === job.userId);
  if (existing) return existing;
  return upsertReconcileMemory(job);
}

export function listReconcileJobs(): ReconcileJob[] {
  return [...jobs()];
}

export function patchReconcileJob(id: string, patch: Partial<ReconcileJob>) {
  const queue = jobs();
  const index = queue.findIndex((row) => row.id === id);
  if (index < 0) return;
  queue[index] = { ...queue[index]!, ...patch };
}
