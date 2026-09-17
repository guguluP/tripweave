import { getSupabaseAdmin } from "./server";

export type PaymentEventInput = {
  userId: string;
  bookingId?: number | null;
  eventType: string;
  orderId?: string | null;
  paymentId?: string | null;
  payload?: Record<string, unknown>;
};

export async function sbInsertPaymentEvent(input: PaymentEventInput): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { error } = await sb.from("payment_events").insert({
    user_id: input.userId,
    booking_id: input.bookingId ?? null,
    provider: "razorpay",
    event_type: input.eventType,
    order_id: input.orderId ?? null,
    payment_id: input.paymentId ?? null,
    payload: input.payload ?? {},
  });
  if (error) {
    console.error("[supabase] payment_events", error.message);
    return false;
  }
  return true;
}
