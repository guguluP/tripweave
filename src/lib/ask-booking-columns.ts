/** Columns Ask may read for one owned confirmation code. Not a full booking row. */
export const ASK_BOOKING_COLUMNS = "package_id,check_in,nights,amount_inr,status,swaps";

const FORBIDDEN = ["*", "card_last4", "card_brand", "upi_handle", "payment_ref", "payer_name", "bank_name", "payment_method"];

export function askBookingColumnsAreNarrow(): boolean {
  const names = ASK_BOOKING_COLUMNS.split(",");
  return names.length > 0 && names.every((name) => !FORBIDDEN.includes(name));
}
