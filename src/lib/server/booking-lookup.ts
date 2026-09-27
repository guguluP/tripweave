import { readMeta } from "@/lib/booking-meta";
import {
  memoryBookingsFor,
  memoryFindByOrderId,
  memoryFindByPaymentRef,
} from "@/lib/booking-memory";
import type { BookingRow } from "@/lib/server/bookings";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sbListBookings } from "@/lib/supabase/bookings";

function mapRow(row: Record<string, unknown>): BookingRow {
  let swaps: Record<string, string> = {};
  const raw = row.swaps;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") swaps = parsed as Record<string, string>;
    } catch {
      swaps = {};
    }
  } else if (raw && typeof raw === "object") {
    swaps = raw as Record<string, string>;
  }
  return {
    id: Number(row.id),
    userId: row.user_id == null ? undefined : String(row.user_id),
    packageId: String(row.package_id),
    packageName: String(row.package_name),
    nights: Number(row.nights),
    travelers: Number(row.travelers),
    checkIn: String(row.check_in).slice(0, 10),
    amountInr: Number(row.amount_inr),
    swaps,
    status: String(row.status),
    cardLast4: row.card_last4 == null ? null : String(row.card_last4),
    cardBrand: row.card_brand == null ? null : String(row.card_brand),
    payerName: String(row.payer_name),
    confirmationCode: String(row.confirmation_code),
    paymentMethod: row.payment_method == null ? "card" : String(row.payment_method),
    paymentRef: row.payment_ref == null ? null : String(row.payment_ref),
    upiHandle: row.upi_handle == null ? null : String(row.upi_handle),
    bankName: row.bank_name == null ? null : String(row.bank_name),
    createdAt: String(row.created_at),
  };
}

export async function sbFindBookingByPaymentRef(paymentRef: string): Promise<BookingRow | null> {
  const sb = getSupabaseAdmin();
  if (!sb || !paymentRef) return null;
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("payment_ref", paymentRef)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function sbFindBookingByOrderId(orderId: string): Promise<BookingRow | null> {
  const sb = getSupabaseAdmin();
  if (!sb || !orderId) return null;
  const { data: event, error } = await sb
    .from("payment_events")
    .select("booking_id, payment_id, user_id")
    .eq("order_id", orderId)
    .not("booking_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !event?.booking_id) return null;
  const { data: booking, error: bookingErr } = await sb
    .from("bookings")
    .select("*")
    .eq("id", event.booking_id)
    .limit(1)
    .maybeSingle();
  if (bookingErr || !booking) return null;
  return mapRow(booking as Record<string, unknown>);
}

export async function findExistingCapturedBooking(opts: {
  userId: string;
  paymentId?: string | null;
  orderId?: string | null;
}): Promise<{ booking: BookingRow; stored: "supabase" | "local" } | null> {
  const paymentId = opts.paymentId?.trim() || "";
  const orderId = opts.orderId?.trim() || "";

  if (paymentId) {
    const mem = memoryFindByPaymentRef(paymentId);
    if (mem && (!mem.userId || mem.userId === opts.userId)) {
      return { booking: { ...mem, userId: mem.userId ?? opts.userId }, stored: "local" };
    }
  }
  if (orderId) {
    const mem = memoryFindByOrderId(opts.userId, orderId);
    if (mem) return { booking: mem, stored: "local" };
  }

  if (isSupabaseConfigured()) {
    if (paymentId) {
      const byPay = await sbFindBookingByPaymentRef(paymentId);
      if (byPay && (!byPay.userId || byPay.userId === opts.userId)) {
        return {
          booking: { ...byPay, userId: byPay.userId ?? opts.userId },
          stored: "supabase",
        };
      }
    }
    if (orderId) {
      const byOrder = await sbFindBookingByOrderId(orderId);
      if (byOrder && (!byOrder.userId || byOrder.userId === opts.userId)) {
        return {
          booking: { ...byOrder, userId: byOrder.userId ?? opts.userId },
          stored: "supabase",
        };
      }
      try {
        const listed = await sbListBookings(opts.userId);
        const hit = listed?.find((row) => readMeta(row.swaps).razorpayOrderId === orderId);
        if (hit) return { booking: { ...hit, userId: hit.userId ?? opts.userId }, stored: "supabase" };
      } catch {
        /* ignore */
      }
    }
  }

  if (orderId) {
    const local = memoryBookingsFor(opts.userId).find(
      (row) => readMeta(row.swaps).razorpayOrderId === orderId,
    );
    if (local) return { booking: local, stored: "local" };
  }

  return null;
}
