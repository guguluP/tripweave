import { getSupabaseAdmin } from "./server";
import type { SbTraveler } from "./types";

export type TravelerInput = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  specialRequests?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  identitySource?: string;
};

export async function sbSaveTravellers(
  userId: string,
  travelers: TravelerInput[],
  bookingId?: number | null,
): Promise<boolean | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  if (!travelers.length) return true;

  const rows = travelers.map((t) => ({
    user_id: userId,
    booking_id: bookingId ?? null,
    full_name: t.fullName,
    phone: t.phone,
    email: t.email,
    date_of_birth: t.dateOfBirth || null,
    gender: t.gender || null,
    nationality: t.nationality || null,
    id_type: t.idType || null,
    id_number: t.idNumber || null,
    special_requests: t.specialRequests || null,
    emergency_name: t.emergencyName || null,
    emergency_phone: t.emergencyPhone || null,
    identity_source: t.identitySource || "manual",
  }));

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
  const { data, error } = await sb
    .from("travellers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[supabase] listTravellers", error.message);
    throw new Error(error.message);
  }
  return data as SbTraveler[];
}
