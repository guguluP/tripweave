import { opsAlertEmail } from "@/lib/server/cron-auth";
import { sbFindBookingByPaymentRef } from "@/lib/server/booking-lookup";
import { listRecentCapturedPayments } from "@/lib/server/razorpay-payments-list";
import { memoryFindByPaymentRef } from "@/lib/booking-memory";
import { sendMail, mailConfigured } from "@/lib/mail/ses";
import { sbInsertPaymentEvent } from "@/lib/supabase/payments";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type AlertState = { alerted: Map<string, number> };
const g = globalThis as typeof globalThis & { __twUnbookedAlerts__?: AlertState };
function alerts(): AlertState {
  if (!g.__twUnbookedAlerts__) g.__twUnbookedAlerts__ = { alerted: new Map() };
  return g.__twUnbookedAlerts__;
}

const ALERT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function alreadyAlerted(paymentId: string): boolean {
  const at = alerts().alerted.get(paymentId);
  if (!at) return false;
  if (Date.now() - at > ALERT_TTL_MS) {
    alerts().alerted.delete(paymentId);
    return false;
  }
  return true;
}

function markAlerted(paymentId: string) {
  alerts().alerted.set(paymentId, Date.now());
}

export type ReconcileUnbookedResult = {
  ok: true;
  scanned: number;
  missing: number;
  alerted: number;
  emailed: boolean;
  opsEmail: string;
};

/**
 * Finds Razorpay captured payments from the last ~36h with no TripWeave booking
 * and emails ops once per payment (7-day dedupe).
 */
export async function runReconcileUnbookedCron(): Promise<ReconcileUnbookedResult> {
  const since = Math.floor(Date.now() / 1000) - 36 * 60 * 60;
  const payments = await listRecentCapturedPayments(since);
  const missing: Array<{ paymentId: string; orderId: string | null; amountInr: number; email: string | null }> =
    [];

  for (const pay of payments) {
    if (memoryFindByPaymentRef(pay.id)) continue;
    if (isSupabaseConfigured()) {
      const booked = await sbFindBookingByPaymentRef(pay.id);
      if (booked) continue;
    }
    missing.push({
      paymentId: pay.id,
      orderId: pay.orderId,
      amountInr: Math.round(pay.amountPaise / 100),
      email: pay.email,
    });
  }

  const fresh = missing.filter((row) => !alreadyAlerted(row.paymentId));
  const opsEmail = opsAlertEmail();
  let emailed = false;

  if (fresh.length > 0) {
    const body = [
      `TripWeave reconcile: ${fresh.length} captured Razorpay payment(s) without a booking.`,
      `Scanned ${payments.length} captured payment(s) since ${new Date(since * 1000).toISOString()}.`,
      "",
      ...fresh.map(
        (row) =>
          `- ${row.paymentId} · order ${row.orderId ?? "—"} · ₹${row.amountInr} · ${row.email ?? "no email"}`,
      ),
      "",
      "Check Razorpay dashboard and /api/verify-payment webhook delivery. Do not charge the guest again.",
    ].join("\n");

    if (mailConfigured()) {
      try {
        emailed = await sendMail({
          to: opsEmail,
          subject: `[TripWeave] ${fresh.length} captured payment(s) without booking`,
          text: body,
        });
      } catch (err) {
        console.error("[reconcile-unbooked] mail", err);
      }
    } else {
      console.warn("[reconcile-unbooked] SES not configured; missing payments:\n" + body);
    }

    for (const row of fresh) {
      markAlerted(row.paymentId);
      if (isSupabaseConfigured()) {
        await sbInsertPaymentEvent({
          userId: "ops",
          bookingId: null,
          eventType: "ops_unbooked_alert",
          orderId: row.orderId,
          paymentId: row.paymentId,
          payload: { amountInr: row.amountInr, emailed },
        });
      }
    }
  }

  return {
    ok: true,
    scanned: payments.length,
    missing: missing.length,
    alerted: fresh.length,
    emailed,
    opsEmail,
  };
}
