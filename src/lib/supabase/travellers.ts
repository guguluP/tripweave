import { getSupabaseAdmin } from "./server";
import type { SbTraveler } from "./types";
import { guestExpiresAt, idLast4 } from "@/lib/travelers";

export type TravelerInput = {
  fullName: string;
  phone: string;
  email: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  digiYatra?: string;
};

function toStayGuestRow(
  userId: string,
  t: TravelerInput,
  bookingId: number | null | undefined,
  expiresAt: string,
) {
  return {
    user_id: userId,
    booking_id: bookingId ?? null,
    full_name: t.fullName,
    phone: t.phone,
    email: t.email,
    nationality: t.nationality || null,
    id_type: t.idType || null,
    id_last4: t.idNumber ? idLast4(t.idNumber) : null,
    id_number: null,
    emergency_name: t.emergencyName || null,
    emergency_phone: t.emergencyPhone || null,
    digiyatra_status: t.digiYatra || null,
    expires_at: expiresAt,
  };
}

export async function sbPurgeExpiredTravellers(userId?: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  let q = sb.from("travellers").delete().lt("expires_at", new Date().toISOString());
  if (userId) q = q.eq("user_id", userId);
  const { error } = await q;
  if (error) console.error("[supabase] purgeTravellers", error.message);
}

export async function sbSaveTravellers(
  userId: string,
  travelers: TravelerInput[],
  opts: { bookingId?: number | null; checkIn: string; nights: number },
): Promise<boolean | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  if (!travelers.length) return true;

  await sbPurgeExpiredTravellers(userId);

  const expiresAt = guestExpiresAt(opts.checkIn, opts.nights);
  const rows = travelers.map((t) => toStayGuestRow(userId, t, opts.bookingId, expiresAt));

  const { error } = await sb.from("travellers").insert(rows);
  if (error) {
    console.error("[supabase] saveTravellers", error.message);
    throw new Error(error.message);
  }
  return true;
}

export async function sbListTravellers(userId: string): Promise<SbTraveler[] | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  await sbPurgeExpiredTravellers(userId);
  const { data, error } = await sb
    .from("travellers")
    .select("*")
    .eq("user_id", userId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[supabase] listTravellers", error.message);
    throw new Error(error.message);
  }
  return data as SbTraveler[];
}
