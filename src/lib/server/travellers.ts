import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { guestExpiresAt, idLast4 } from "@/lib/travelers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sbSaveTravellers } from "@/lib/supabase/travellers";
import { isDurableDbError, markDurableDbFailed, shouldSkipNeon } from "./db-fallback";

const travelerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  nationality: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  digiYatra: z.string().optional(),
});

const saveSchema = z.object({
  travelers: z.array(travelerSchema).min(1).max(12),
  bookingId: z.number().int().optional().nullable(),
  checkIn: z.string(),
  nights: z.number().int().min(1).max(30),
});

export const saveTravellers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => saveSchema.parse(data))
  .handler(async ({ context, data }) => {
    if (isSupabaseConfigured()) {
      try {
        await sbSaveTravellers(context.userId, data.travelers, {
          bookingId: data.bookingId,
          checkIn: data.checkIn,
          nights: data.nights,
        });
        return { ok: true as const, stored: "supabase" as const };
      } catch (err) {
        if (isDurableDbError(err)) markDurableDbFailed(err);
        console.error("[travellers] supabase save failed", err);
        return { ok: true as const, stored: "local" as const };
      }
    }

    if (shouldSkipNeon() || Boolean(process.env.VERCEL) || !process.env.DATABASE_URL?.trim()) {
      return { ok: true as const, stored: "local" as const };
    }

    try {
      const sql = await getSql();
      const expiresAt = guestExpiresAt(data.checkIn, data.nights);
      for (const t of data.travelers) {
        await sql`
          insert into stay_guests (
            user_id, booking_id, full_name, phone, email, nationality,
            id_type, id_last4, emergency_name, emergency_phone, digiyatra_status, expires_at
          ) values (
            ${context.userId}, ${data.bookingId ?? null}, ${t.fullName}, ${t.phone}, ${t.email},
            ${t.nationality ?? null}, ${t.idType ?? null}, ${t.idNumber ? idLast4(t.idNumber) : null},
            ${t.emergencyName ?? null}, ${t.emergencyPhone ?? null}, ${t.digiYatra ?? null},
            ${expiresAt}::timestamptz
          )
        `;
      }
      await sql`delete from stay_guests where user_id = ${context.userId} and expires_at < now()`;
      return { ok: true as const, stored: "db" as const };
    } catch (err) {
      markDurableDbFailed(err);
      return { ok: true as const, stored: "local" as const };
    }
  });
