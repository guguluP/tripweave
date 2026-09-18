import type { BookingRow } from "@/lib/server/bookings";
import { twApply } from "./rpc";

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
  const data = await twApply<SbBooking[]>("list_bookings", { user_id: userId });
  return (Array.isArray(data) ? data : []).map(mapSbBooking);
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
  const data = await twApply<SbBooking>("insert_booking", {
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
  });
  if (!data) return null;
  return mapSbBooking(data);
}

export async function sbCancelBooking(
  userId: string,
  id: number,
): Promise<boolean | null> {
  await twApply("cancel_booking", { user_id: userId, id });
  return true;
}
