import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { readMeta, writeMeta } from "@/lib/booking-meta";
import { memoryUpdateBooking } from "@/lib/booking-memory";
import { getSql } from "@/lib/db";
import { deskFor } from "@/lib/hotel-desk";
import { sendBookingMail } from "@/lib/mail/send";
import { isActiveStayStatus } from "@/lib/refund-policy";
import { takeAskSlot } from "@/lib/server/ask-store";
import { findOwnBookingRowByCode } from "@/lib/server/booking-lookup";
import { shouldSkipNeon } from "@/lib/server/db-fallback";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { parseTravelPlan, pickupQuoteFor } from "@/lib/travel-plan";

async function saveSwaps(userId: string, confirmationCode: string, bookingId: number | undefined, swaps: Record<string, string>) {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (!sb) return false;
    const { error } = await sb
      .from("bookings")
      .update({ swaps })
      .eq("user_id", userId)
      .eq("confirmation_code", confirmationCode);
    if (error) return false;
  } else if (!shouldSkipNeon() && !process.env.VERCEL) {
    try {
      const sql = await getSql();
      await sql.query("update bookings set swaps = $1 where user_id = $2 and confirmation_code = $3", [
        JSON.stringify(swaps),
        userId,
        confirmationCode,
      ]);
    } catch {
      return false;
    }
  }
  if (bookingId) memoryUpdateBooking(userId, bookingId, { swaps });
  return true;
}

/**
 * Ask the hotel for the airport car. Only for a live stay on this account, at most 3 requests
 * per booking per day. The desk email goes first: when it cannot be sent, the guest is told
 * and nothing is saved. TripWeave still adds ₹0.
 */
export const requestHotelCar = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z.object({ confirmationCode: z.string().trim().regex(/^[A-Za-z0-9-]{3,40}$/) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const booking = await findOwnBookingRowByCode(context.userId, data.confirmationCode);
    if (!booking) return { ok: false as const, message: "That stay is not on this account." };
    if (!isActiveStayStatus(booking.status)) {
      return { ok: false as const, message: "This stay is no longer active, so the car cannot be requested." };
    }
    const plan = parseTravelPlan(readMeta(booking.swaps).travel);
    const pickup = pickupQuoteFor(booking.packageId, plan.arriveBy || "fly");
    if (plan.arriveBy !== "fly" || !pickup.available) {
      return { ok: false as const, message: "This stay does not include a hotel airport car." };
    }
    if (plan.includePickup) return { ok: true as const, already: true };

    const slot = await takeAskSlot(context.userId, "car", booking.confirmationCode);
    if (slot === "limited") {
      return { ok: false as const, message: "The car was already requested today. Contact the hotel desk directly." };
    }
    if (slot === "error") return { ok: false as const, message: "Could not send the car request. Try again later." };

    const desk = deskFor(booking.packageId);
    let sent = false;
    try {
      sent = await sendBookingMail({
        to: desk.email,
        subject: `Airport car requested (${booking.confirmationCode})`,
        text: [
          "Airport car requested · arriving time not given",
          `Confirmation ${booking.confirmationCode}`,
          `${booking.packageName} · check-in ${booking.checkIn}`,
          "TripWeave adds ₹0. The hotel bills the car.",
        ].join("\n"),
      });
    } catch (err) {
      console.error("[ask] car mail", err instanceof Error ? err.name : "failed");
      sent = false;
    }
    if (!sent) {
      return {
        ok: false as const,
        message: `Could not email the hotel desk. Ask them directly: ${desk.email}.`,
      };
    }
    const swaps = writeMeta(booking.swaps, { travel: { ...plan, includePickup: true } });
    if (!(await saveSwaps(context.userId, booking.confirmationCode, booking.id, swaps))) {
      return {
        ok: false as const,
        message: "The hotel desk was emailed, but the car could not be saved on this trip.",
      };
    }
    return { ok: true as const, already: false };
  });
