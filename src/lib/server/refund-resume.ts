import type { BookingRow } from "@/lib/server/bookings";
import { listRefundIntents, memoryUpdateBooking } from "@/lib/booking-memory";
import { writeMeta } from "@/lib/booking-meta";
import { releaseHoldById } from "@/lib/inventory";
import { persistRefundIntent } from "@/lib/server/payment-ops";
import { isDurableDbError, markDurableDbFailed } from "@/lib/server/db-fallback";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sbCancelBooking } from "@/lib/supabase/bookings";

/** Finish a cancel that already decided the amount. Does not refund a second time. */
export async function resumePendingRefundsForUser(userId: string, rows: BookingRow[]) {
  const now = Date.now();
  for (const intent of listRefundIntents(userId)) {
    if (intent.status === "applied") continue;
    const booking = rows.find((row) => row.id === intent.bookingId);
    if (!booking) continue;
    if (booking.status === "refunded" || booking.status === "cancelled") {
      await persistRefundIntent({ ...intent, status: "applied", updatedAt: new Date().toISOString() });
      continue;
    }
    if (intent.status === "pending" && intent.updatedAt !== intent.createdAt) {
      const updated = Date.parse(intent.updatedAt);
      if (Number.isFinite(updated) && now - updated < 60_000) continue;
    }
    let refundId = intent.refundId;
    const ref = booking.paymentRef || intent.paymentRef;
    if (intent.status !== "gateway_done" && booking.paymentMethod === "razorpay") {
      if (!ref.startsWith("pay_")) {
        await persistRefundIntent({ ...intent, status: "pending", updatedAt: new Date().toISOString() });
        continue;
      }
      const { fetchRazorpayPayment, refundRazorpayPayment } = await import("@/lib/server/razorpay");
      const payment = await fetchRazorpayPayment(ref);
      const already = (payment?.amountRefundedPaise ?? 0) >= Math.round(intent.amountInr * 100);
      if (!already) {
        const refunded = await refundRazorpayPayment(ref, intent.amountInr);
        if (!refunded.ok) {
          await persistRefundIntent({ ...intent, status: "pending", updatedAt: new Date().toISOString() });
          continue;
        }
        refundId = refunded.refundId;
      } else {
        refundId = refundId ?? "already_refunded";
      }
      await persistRefundIntent({
        ...intent,
        status: "gateway_done",
        refundId,
        updatedAt: new Date().toISOString(),
      });
    }
    const meta = writeMeta(booking.swaps, {
      refundId,
      refundAmount: intent.amountInr,
      refundedAt: new Date().toISOString(),
    });
    memoryUpdateBooking(userId, booking.id, { status: "refunded", swaps: meta });
    releaseHoldById(booking.confirmationCode);
    let statusSaved = true;
    if (isSupabaseConfigured()) {
      try {
        await sbCancelBooking(userId, booking.id, { status: "refunded", swaps: meta });
      } catch (err) {
        statusSaved = false;
        if (isDurableDbError(err)) markDurableDbFailed(err);
        console.error("[bookings] refund resume status", err);
      }
    }
    if (!statusSaved) continue;
    booking.status = "refunded";
    booking.swaps = meta;
    await persistRefundIntent({
      ...intent,
      status: "applied",
      refundId,
      updatedAt: new Date().toISOString(),
    });
  }
}
