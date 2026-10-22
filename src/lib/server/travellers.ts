import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { deskFor } from "@/lib/hotel-desk";
import { guestRowsFromInput, travelerListSchema } from "@/lib/traveller-schema";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sbSaveTravellers } from "@/lib/supabase/travellers";
import { isDurableDbError, markDurableDbFailed, shouldSkipNeon } from "./db-fallback";
import { insertStayGuests, travelerToInput } from "./stay-guests";

const saveSchema = z.object({
  travelers: travelerListSchema,
  bookingId: z.number().int().optional().nullable(),
  checkIn: z.string(),
  nights: z.number().int().min(1).max(30),
  packageId: z.string().optional(),
});

export const saveTravellers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }) => {
    const policy = data.packageId ? (deskFor(data.packageId).guestDetails ?? "lead_only") : "lead_only";
    const prepared = guestRowsFromInput(data.travelers, policy);
    if (!prepared.ok) return { ok: false as const, message: prepared.message };
    const guests = prepared.guests.map(travelerToInput);
    if (isSupabaseConfigured()) {
      try {
        await sbSaveTravellers(context.userId, guests, {
          bookingId: data.bookingId,
          checkIn: data.checkIn,
          nights: data.nights,
        });
        return { ok: true as const, stored: "supabase" as const };
      } catch (err) {
        if (isDurableDbError(err)) markDurableDbFailed(err);
        console.error("[travellers] supabase save failed", err);
        return { ok: false as const, message: "Could not save guest details." };
      }
    }

    if (shouldSkipNeon() || Boolean(process.env.VERCEL) || !process.env.DATABASE_URL?.trim()) {
      return { ok: true as const, stored: "local" as const };
    }

    try {
      const sql = await getSql();
      if (data.bookingId == null) {
        return { ok: false as const, message: "Guest details need a booking." };
      }
      await insertStayGuests(sql, {
        userId: context.userId,
        bookingId: data.bookingId,
        checkIn: data.checkIn,
        nights: data.nights,
        guests,
      });
      await sql`delete from stay_guests where user_id = ${context.userId} and expires_at < now()`;
      return { ok: true as const, stored: "db" as const };
    } catch (err) {
      if (isDurableDbError(err)) markDurableDbFailed(err);
      else console.error("[travellers] save failed", err);
      return { ok: false as const, message: "Could not save guest details." };
    }
  });
