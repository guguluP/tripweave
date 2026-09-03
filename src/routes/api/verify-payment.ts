import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";

/**
 * POST /api/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns: { success: true } or 400 on mismatch
 */
export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
          if (!keySecret) {
            return Response.json(
              { error: "Razorpay is not configured" },
              { status: 500 },
            );
          }

          const body = (await request.json()) as {
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
          };

          const orderId = body.razorpay_order_id?.trim();
          const paymentId = body.razorpay_payment_id?.trim();
          const signature = body.razorpay_signature?.trim();

          if (!orderId || !paymentId || !signature) {
            return Response.json(
              {
                error:
                  "Missing razorpay_order_id, razorpay_payment_id, or razorpay_signature",
              },
              { status: 400 },
            );
          }

          const expected = createHmac("sha256", keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

          if (expected !== signature) {
            return Response.json(
              { success: false, error: "Signature mismatch" },
              { status: 400 },
            );
          }

          return Response.json({
            success: true,
            order_id: orderId,
            payment_id: paymentId,
          });
        } catch (err) {
          console.error("[api/verify-payment]", err);
          return Response.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
