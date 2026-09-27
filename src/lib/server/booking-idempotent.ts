import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { findExistingCapturedBooking } from "@/lib/server/booking-lookup";
import {
  bookCapturedFromNotes,
  createBooking,
  type CreateBookingResult,
} from "@/lib/server/bookings";

/** Webhook / capture path: no-op if payment or order already booked. */
export async function bookCapturedIdempotent(input: {
  userId: string;
  paymentId: string;
  orderId: string | null;
  packageId: string;
  packageName: string;
  roomId: string;
  checkIn: string;
  nights: number;
  travelers: number;
  amountInr: number;
  payerName: string;
  guestEmail?: string;
}): Promise<void> {
  const existing = await findExistingCapturedBooking({
    userId: input.userId,
    paymentId: input.paymentId,
    orderId: input.orderId,
  });
  if (existing) return;
  await bookCapturedFromNotes(input);
}

const createSchema = z.object({
  packageId: z.string(),
  swaps: z.record(z.string(), z.string()).optional().default({}),
  travelers: z.number().int().min(1).max(12),
  checkIn: z.string(),
  nights: z.number().int().min(1).max(14).optional(),
  roomId: z.string().max(40).optional(),
  payerName: z.string().min(2),
  method: z.enum(["card", "upi", "netbanking", "razorpay"]),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  cvc: z.string().optional(),
  upiId: z.string().optional(),
  bankId: z.string().optional(),
  bankPin: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

/**
 * Browser verify path with an early payment/order lookup so double-submit
 * does not create a second TW- code when memory/DB already have the stay.
 * Durable inserts also unique on payment_ref.
 */
export const createBookingIdempotent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }): Promise<CreateBookingResult> => {
    if (data.method === "razorpay" && (data.razorpayPaymentId || data.razorpayOrderId)) {
      const already = await findExistingCapturedBooking({
        userId: context.userId,
        paymentId: data.razorpayPaymentId,
        orderId: data.razorpayOrderId,
      });
      if (already) {
        return { ok: true, booking: already.booking, stored: already.stored };
      }
    }
    return createBooking({ data });
  });
