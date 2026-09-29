import { notifyDesk, notifyGuestPaid, type DeskNotice } from "@/lib/server/desk-notify";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Notice = {
  bookingId?: number;
  guestEmail?: string | null;
  packageId: string;
  packageName: string;
  confirmationCode: string;
  checkIn: string;
  nights: number;
  travelers: number;
  amountInr: number;
  payerName: string;
  roomName?: string;
};

/** Guest and hotel desk. SES when configured; WhatsApp stub otherwise. */
export async function sendBookingNotices(input: Notice) {
  const notice: DeskNotice = {
    bookingId: input.bookingId ?? 0,
    guestEmail: input.guestEmail,
    packageId: input.packageId,
    packageName: input.packageName,
    confirmationCode: input.confirmationCode,
    checkIn: input.checkIn,
    nights: input.nights,
    travelers: input.travelers,
    amountInr: input.amountInr,
    payerName: input.payerName,
    roomName: input.roomName,
  };
  await notifyGuestPaid(notice);
  const desk = await notifyDesk(notice);
  if (desk.email && input.bookingId && isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (sb) {
      try {
        await sb.from("bookings").update({ desk_notified_at: new Date().toISOString() }).eq("id", input.bookingId);
      } catch {
        /* column may not exist until partner_desk_ops.sql is applied */
      }
    }
  }
  return desk;
}
