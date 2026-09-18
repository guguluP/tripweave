import { twApply } from "./rpc";
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

export async function sbPurgeExpiredTravellers(userId?: string): Promise<void> {
  if (!userId) return;
  try {
    await twApply("list_travellers", { user_id: userId });
  } catch (err) {
    console.error("[supabase] purgeTravellers", err);
  }
}

export async function sbSaveTravellers(
  userId: string,
  travelers: TravelerInput[],
  opts: { bookingId?: number | null; checkIn: string; nights: number },
): Promise<boolean | null> {
  if (!travelers.length) return true;
  const expiresAt = guestExpiresAt(opts.checkIn, opts.nights);
  await twApply("save_travellers", {
    user_id: userId,
    booking_id: opts.bookingId ?? null,
    travelers: travelers.map((t) => ({
      full_name: t.fullName,
      phone: t.phone,
      email: t.email,
      nationality: t.nationality || null,
      id_type: t.idType || null,
      id_last4: t.idNumber ? idLast4(t.idNumber) : null,
      emergency_name: t.emergencyName || null,
      emergency_phone: t.emergencyPhone || null,
      digiyatra_status: t.digiYatra || null,
      expires_at: expiresAt,
    })),
  });
  return true;
}

export async function sbListTravellers(userId: string): Promise<SbTraveler[] | null> {
  const data = await twApply<SbTraveler[]>("list_travellers", { user_id: userId });
  return Array.isArray(data) ? data : [];
}
