import { twApply } from "./rpc";

export type PaymentEventInput = {
  userId: string;
  bookingId?: number | null;
  eventType: string;
  orderId?: string | null;
  paymentId?: string | null;
  payload?: Record<string, unknown>;
};

export async function sbInsertPaymentEvent(input: PaymentEventInput): Promise<boolean> {
  try {
    await twApply("insert_payment_event", {
      user_id: input.userId,
      booking_id: input.bookingId ?? null,
      provider: "razorpay",
      event_type: input.eventType,
      order_id: input.orderId ?? null,
      payment_id: input.paymentId ?? null,
      payload: input.payload ?? {},
    });
    return true;
  } catch (err) {
    console.error("[supabase] payment_events", err);
    return false;
  }
}
