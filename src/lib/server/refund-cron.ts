import { memoryBookingsFor } from "@/lib/booking-memory";
import { resumePendingRefundsForUser } from "@/lib/server/bookings";
import { hydrateRefundIntents, loadAllOpenRefundIntents } from "@/lib/server/payment-ops";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sbListBookings } from "@/lib/supabase/bookings";

export type RefundCronResult = {
  users: number;
  intents: number;
  ok: true;
};

/**
 * Retries pending / gateway_done refund intents for every guest.
 * Same work My trips does per user, on a schedule so failed refunds do not wait for a visit.
 */
export async function runRefundRetryCron(): Promise<RefundCronResult> {
  const intents = await loadAllOpenRefundIntents();
  const userIds = [...new Set(intents.map((row) => row.userId))];
  for (const userId of userIds) {
    try {
      await hydrateRefundIntents(userId);
      let rows = memoryBookingsFor(userId);
      if (isSupabaseConfigured()) {
        try {
          const cloud = await sbListBookings(userId);
          if (cloud?.length) {
            rows = cloud.map((row) => ({ ...row, userId: row.userId ?? userId }));
          }
        } catch (err) {
          console.error("[refund-cron] list bookings", userId, err);
        }
      }
      await resumePendingRefundsForUser(userId, rows);
    } catch (err) {
      console.error("[refund-cron] user", userId, err);
    }
  }
  return { ok: true, users: userIds.length, intents: intents.length };
}
