import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";
import { memoryBookingsFor } from "@/lib/booking-memory";
import { buildGstInvoicePdf, invoiceFilename } from "@/lib/server/gst-invoice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sbListBookings } from "@/lib/supabase/bookings";

/** GST tax invoice PDF for a paid stay the signed-in guest owns. */
export const Route = createFileRoute("/api/invoice/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const code = params.code?.trim();
        if (!code) return Response.json({ error: "Missing confirmation code." }, { status: 400 });
        const user = await getSessionUser();
        if (!user) return Response.json({ error: "Sign in to download your invoice." }, { status: 401 });

        let booking = memoryBookingsFor(user.id).find((row) => row.confirmationCode === code);
        if (!booking && isSupabaseConfigured()) {
          try {
            const rows = await sbListBookings(user.id);
            booking = rows?.find((row) => row.confirmationCode === code);
          } catch (err) {
            console.error("[invoice] list", err);
          }
        }
        if (!booking) {
          return Response.json({ error: "Invoice not found for this account." }, { status: 404 });
        }

        const pdf = buildGstInvoicePdf(booking);
        return new Response(Buffer.from(pdf), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${invoiceFilename(booking)}"`,
            "Cache-Control": "private, no-store",
          },
        });
      },
    },
  },
});
