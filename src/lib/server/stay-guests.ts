import { memoryDeleteBooking } from "@/lib/booking-memory";
import { guestExpiresAt, idLast4, type Traveler } from "@/lib/travelers";
import { sbDeleteBooking } from "@/lib/supabase/bookings";
import { sbSaveTravellers, type TravelerInput } from "@/lib/supabase/travellers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSql, type Sql } from "@/lib/db";
import { shouldSkipNeon } from "./db-fallback";

const memoryGuests = new Map<number, TravelerInput[]>();

export function travelerToInput(t: Traveler): TravelerInput {
  return {
    fullName: t.fullName,
    phone: t.phone || "",
    email: t.email || "",
    nationality: t.nationality || undefined,
    idType: t.idType || undefined,
    idNumber: t.idNumber || undefined,
    emergencyName: t.emergencyName || undefined,
    emergencyPhone: t.emergencyPhone || undefined,
    digiYatra: t.digiYatra || undefined,
    isLead: t.role === "lead",
    ageBand: t.ageBand,
  };
}

export function memorySaveGuests(bookingId: number, guests: TravelerInput[]) {
  memoryGuests.set(bookingId, guests);
}

export function memoryGuestsFor(bookingId: number): TravelerInput[] {
  return memoryGuests.get(bookingId) ?? [];
}

export async function insertStayGuests(
  sql: Sql,
  input: { userId: string; bookingId: number; checkIn: string; nights: number; guests: TravelerInput[] },
) {
  const expiresAt = guestExpiresAt(input.checkIn, input.nights);
  await sql`delete from stay_guests where booking_id = ${input.bookingId} and user_id = ${input.userId}`;
  for (const t of input.guests) {
    await sql`
      insert into stay_guests (
        user_id, booking_id, full_name, phone, email, nationality,
        id_type, id_last4, emergency_name, emergency_phone, digiyatra_status, expires_at,
        is_lead, age_band
      ) values (
        ${input.userId}, ${input.bookingId}, ${t.fullName}, ${t.phone || ""}, ${t.email || ""},
        ${t.nationality ?? null}, ${t.idType ?? null}, ${t.idNumber ? idLast4(t.idNumber) : null},
        ${t.emergencyName ?? null}, ${t.emergencyPhone ?? null}, ${t.digiYatra ?? null},
        ${expiresAt}::timestamptz, ${Boolean(t.isLead)}, ${t.ageBand ?? null}
      )
    `;
  }
}

/** Write guests for a booking that already exists. Throws if the durable write fails. */
export async function persistBookingGuests(input: {
  userId: string;
  bookingId: number;
  checkIn: string;
  nights: number;
  guests: TravelerInput[];
}): Promise<void> {
  if (input.guests.length === 0) return;
  if (isSupabaseConfigured()) {
    const saved = await sbSaveTravellers(input.userId, input.guests, {
      bookingId: input.bookingId,
      checkIn: input.checkIn,
      nights: input.nights,
    });
    if (!saved) throw new Error("guest save failed");
    return;
  }
  if (shouldSkipNeon()) {
    memorySaveGuests(input.bookingId, input.guests);
    return;
  }
  const sql = await getSql();
  await insertStayGuests(sql, input);
}

/** Remove a booking that was stored without its guests. */
export async function removeBooking(userId: string, bookingId: number): Promise<void> {
  memoryDeleteBooking(userId, bookingId);
  memoryGuests.delete(bookingId);
  if (isSupabaseConfigured()) {
    try {
      await sbDeleteBooking(userId, bookingId);
    } catch (err) {
      console.error("[bookings] delete after guest failure", err);
    }
  }
  if (shouldSkipNeon()) return;
  try {
    const sql = await getSql();
    await sql`delete from bookings where id = ${bookingId} and user_id = ${userId}`;
  } catch (err) {
    console.error("[bookings] delete after guest failure", err);
  }
}
