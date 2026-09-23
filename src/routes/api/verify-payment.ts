import { createFileRoute } from "@tanstack/react-router";
import { settleRazorpayWebhook } from "@/lib/server/razorpay";

/** Razorpay webhook. Browser checkout still verifies inside createBooking. */
export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        return settleRazorpayWebhook(raw, request.headers.get("x-razorpay-signature"));
      },
      GET: async () =>
        Response.json({ ok: true, hook: "POST Razorpay payment.captured here." }),
    },
  },
});
