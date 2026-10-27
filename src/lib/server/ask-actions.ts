import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { readMeta, writeMeta } from "@/lib/booking-meta";
import { memoryFindByConfirmation, memoryUpdateBooking } from "@/lib/booking-memory";
import { deskFor } from "@/lib/hotel-desk";
import { sendBookingMail } from "@/lib/mail/send";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sbListBookings } from "@/lib/supabase/bookings";
import { parseTravelPlan, pickupQuoteFor } from "@/lib/travel-plan";

async function ownedBooking(userId: string, confirmationCode: string) {
  const code = confirmationCode.trim();
  if (isSupabaseConfigured()) {
    try {
      const rows = await sbListBookings(userId);
      const hit = rows?.find((row) => row.confirmationCode === code);
      if (hit) return hit;
    } catch {
      /* fall through */
    }
  }
  return memoryFindByConfirmation(userId, code) ?? null;
}

/** Ask the hotel for the airport car. The guest confirms. TripWeave still adds ₹0. */
export const requestHotelCar = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ confirmationCode: z.string().trim().min(3).max(40) }).parse(data))
  .handler(async ({ context, data }) => {
    const booking = await ownedBooking(context.userId, data.confirmationCode);
    if (!booking) return { ok: false as const, message: "That stay is not on this account." };
    const plan = parseTravelPlan(readMeta(booking.swaps).travel);
    const pickup = pickupQuoteFor(booking.packageId, plan.arriveBy || "fly");
    if (plan.arriveBy !== "fly" || !pickup.available) {
      return { ok: false as const, message: "This stay does not include a hotel airport car." };
    }
    if (plan.includePickup) return { ok: true as const, already: true };
    const swaps = writeMeta(booking.swaps, { travel: { ...plan, includePickup: true } });
    if (isSupabaseConfigured()) {
      const sb = getSupabaseAdmin();
      if (sb) {
        const { error } = await sb
          .from("bookings")
          .update({ swaps })
          .eq("user_id", context.userId)
          .eq("confirmation_code", booking.confirmationCode);
        if (error) return { ok: false as const, message: "Could not save the car request." };
      }
    }
    if (booking.id) memoryUpdateBooking(context.userId, booking.id, { swaps });
    const desk = deskFor(booking.packageId);
    try {
      await sendBookingMail({
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
    }
    return { ok: true as const, already: false };
  });
