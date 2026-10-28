/**
 * Hotel desk on the Postgres (DATABASE_URL) store.
 *
 * The Supabase path lists stays with the tw_desk_bookings RPC and refunds a declined stay in
 * desk-ops.ts. On Postgres the desk page listed nothing and a decline only set the row to
 * cancelled, so the guest's money never went back. These helpers close both gaps.
 */
import { getSql } from "@/lib/db";
import { readMeta, writeMeta } from "@/lib/booking-meta";
import { releaseHoldById } from "@/lib/inventory";
import { persistRefundIntent } from "@/lib/server/payment-ops";

/** The statuses the desk works on. Same list as tw_desk_bookings in supabase/partner_desk_ops.sql. */
export const DESK_LIST_STATUSES = ["paid", "confirmed", "desk_confirmed", "checked_in", "held"] as const;

export type PgDeskBooking = {
  id: number;
  packageId: string;
  packageName: string;
  checkIn: string;
  nights: number;
  travelers: number;
  payerName: string;
  status: string;
  confirmationCode: string;
  amountInr: number;
  guestEmail?: string | null;
  opsFlaggedAt?: string | null;
};

type Row = {
  id: number | string;
  package_id: string;
  package_name: string;
  check_in: string | Date;
  nights: number;
  travelers: number;
  payer_name: string | null;
  status: string;
  confirmation_code: string;
  amount_inr: number | string;
  swaps: string | null;
  ops_flagged_at: string | Date | null;
};

function parseSwaps(raw: unknown): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function isoDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function mapDeskRow(row: Row): PgDeskBooking {
  const swaps = parseSwaps(row.swaps);
  const meta = readMeta(swaps);
  return {
    id: Number(row.id),
    packageId: row.package_id,
    packageName: row.package_name,
    checkIn: isoDate(row.check_in),
    nights: Number(row.nights),
    travelers: Number(row.travelers),
    payerName: row.payer_name ?? "",
    status: row.status,
    confirmationCode: row.confirmation_code,
    amountInr: Number(row.amount_inr) || 0,
    guestEmail: meta.guestEmail ?? (typeof swaps.guestEmail === "string" ? swaps.guestEmail : null),
    opsFlaggedAt: row.ops_flagged_at ? new Date(row.ops_flagged_at).toISOString() : null,
  };
}

/** Desk list for one property, newest first. */
export async function pgDeskBookings(packageId: string): Promise<PgDeskBooking[]> {
  const sql = await getSql();
  const rows = await sql<Row>`
    select id, package_id, package_name, check_in, nights, travelers, payer_name, status,
           confirmation_code, amount_inr, swaps, ops_flagged_at
    from bookings
    where package_id = ${packageId}
      and status in ('paid', 'confirmed', 'desk_confirmed', 'checked_in', 'held')
    order by created_at desc
  `;
  return rows.map(mapDeskRow);
}

export type DeclineRefundResult = { ok: true; status: string; message?: string };

/**
 * After tw_desk_transition moved a paid stay to cancelled: refund the full amount.
 * tw_desk_transition locks the row and only accepts paid, so a second decline (double click or a
 * second server) fails there and never reaches this refund.
 */
export async function pgRefundDeclinedStay(input: { id: number; packageId: string }): Promise<DeclineRefundResult> {
  const sql = await getSql();
  const found = await sql<{
    status: string;
    amount_inr: number | string;
    payment_ref: string | null;
    payment_method: string | null;
    user_id: string | null;
    swaps: string | null;
    confirmation_code: string;
  }>`
    select status, amount_inr, payment_ref, payment_method, user_id, swaps, confirmation_code
    from bookings where id = ${input.id} and package_id = ${input.packageId}
  `;
  const row = found[0];
  if (!row || row.status !== "cancelled") return { ok: true, status: row?.status ?? "cancelled" };
  releaseHoldById(row.confirmation_code);
  const amountInr = Number(row.amount_inr) || 0;
  const ref = String(row.payment_ref ?? "");
  const userId = String(row.user_id ?? "");
  if (row.payment_method !== "razorpay" || !ref.startsWith("pay_") || amountInr <= 0) {
    return { ok: true, status: "cancelled" };
  }
  const now = () => new Date().toISOString();
  const intentBase = {
    id: `refund_${userId}_${input.id}`,
    userId,
    bookingId: input.id,
    paymentRef: ref,
    amountInr,
    createdAt: now(),
  };
  if (userId) await persistRefundIntent({ ...intentBase, status: "pending", refundId: undefined, updatedAt: now() });

  const { fetchRazorpayPayment, refundRazorpayPayment } = await import("@/lib/server/razorpay");
  const payment = await fetchRazorpayPayment(ref);
  const already = (payment?.amountRefundedPaise ?? 0) >= Math.round(amountInr * 100);
  let refundId = already ? "already_refunded" : "";
  if (!already) {
    const refunded = await refundRazorpayPayment(ref, amountInr);
    if (!refunded.ok) {
      // The stay is closed; keep the money owed visible and let the refund resume pick it up.
      await sql`
        update bookings set status = 'refund_pending'
        where id = ${input.id} and package_id = ${input.packageId} and status = 'cancelled'
      `;
      return {
        ok: true,
        status: "refund_pending",
        message: `Declined. The stay is closed; automatic refund failed and is queued. ${refunded.message}`,
      };
    }
    refundId = refunded.refundId;
  }
  if (userId) await persistRefundIntent({ ...intentBase, status: "gateway_done", refundId, updatedAt: now() });
  const meta = writeMeta(parseSwaps(row.swaps), { refundId, refundAmount: amountInr, refundedAt: now() });
  const updated = await sql`
    update bookings set status = 'refunded', swaps = ${JSON.stringify(meta)}
    where id = ${input.id} and package_id = ${input.packageId} and status = 'cancelled'
    returning id
  `;
  if (!updated.length) {
    return {
      ok: true,
      status: "refund_pending",
      message: `Declined. ₹${amountInr.toLocaleString("en-IN")} was sent back; stay status will catch up shortly.`,
    };
  }
  if (userId) await persistRefundIntent({ ...intentBase, status: "applied", refundId, updatedAt: now() });
  return {
    ok: true,
    status: "refunded",
    message: `Declined. ₹${amountInr.toLocaleString("en-IN")} will return to the original payment.`,
  };
}
