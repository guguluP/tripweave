import type { BookingRow } from "@/lib/server/bookings";
import { getSupabaseAdmin } from "./server";
import type { SbBooking } from "./types";

function mapSbBooking(row: SbBooking): BookingRow {
  let swaps: Record<string, string> = {};
  if (typeof row.swaps === "string") {
    try {
      const parsed = JSON.parse(row.swaps) as unknown;
      if (parsed && typeof parsed === "object") swaps = parsed as Record<string, string>;
    } catch {
      swaps = {};
    }
  } else if (row.swaps && typeof row.swaps === "object") {
    swaps = row.swaps as Record<string, string>;
  }
  return {
    id: row.id,
    packageId: row.package_id,
    packageName: row.package_name,
    nights: row.nights,
    travelers: row.travelers,
    checkIn: row.check_in,
    amountInr: row.amount_inr,
    swaps,
    status: row.status,
    cardLast4: row.card_last4,
    cardBrand: row.card_brand,
    payerName: row.payer_name,
    confirmationCode: row.confirmation_code,
    paymentMethod: row.payment_method ?? "card",
    paymentRef: row.payment_ref,
    upiHandle: row.upi_handle,
    bankName: row.bank_name,
    createdAt: row.created_at,
  };
}

export async function sbListBookings(userId: string): Promise<BookingRow[] | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[supabase] listBookings", error.message);
    throw new Error(error.message);
  }
  return (data as SbBooking[]).map(mapSbBooking);
}

export type InsertBookingInput = {
  userId: string;
  packageId: string;
  packageName: string;
  nights: number;
  travelers: number;
  checkIn: string;
  amountInr: number;
  swaps: Record<string, string>;
  status: string;
  cardLast4: string | null;
  cardBrand: string | null;
  payerName: string;
  confirmationCode: string;
  paymentMethod: string;
  paymentRef: string | null;
  upiHandle: string | null;
  bankName: string | null;
};

export async function sbInsertBooking(
  input: InsertBookingInput,
): Promise<BookingRow | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb
    .from("bookings")
    .insert({
      user_id: input.userId,
      package_id: input.packageId,
      package_name: input.packageName,
      nights: input.nights,
      travelers: input.travelers,
      check_in: input.checkIn,
      amount_inr: input.amountInr,
      swaps: input.swaps,
      status: input.status,
      card_last4: input.cardLast4,
      card_brand: input.cardBrand,
      payer_name: input.payerName,
      confirmation_code: input.confirmationCode,
      payment_method: input.paymentMethod,
      payment_ref: input.paymentRef,
      upi_handle: input.upiHandle,
      bank_name: input.bankName,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[supabase] insertBooking", error.message);
    throw new Error(error.message);
  }
  return mapSbBooking(data as SbBooking);
}

export async function sbCancelBooking(
  userId: string,
  id: number,
): Promise<boolean | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { error } = await sb
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "paid");
  if (error) {
    console.error("[supabase] cancelBooking", error.message);
    throw new Error(error.message);
  }
  return true;
}
