import { createFileRoute } from "@tanstack/react-router";

/**
 * POST /api/create-order
 * Body: { amount: number (paise), currency?: string, receipt?: string }
 * Returns: { order_id, amount, currency, key_id }
 */
export const Route = createFileRoute("/api/create-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "";
          const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
          if (!keyId || !keySecret) {
            return Response.json(
              { error: "Razorpay is not configured" },
              { status: 500 },
            );
          }

          const body = (await request.json()) as {
            amount?: number;
            currency?: string;
            receipt?: string;
          };

          const amount = Number(body.amount);
          if (!Number.isFinite(amount) || amount < 100) {
            return Response.json(
              { error: "Amount must be at least 100 paise" },
              { status: 400 },
            );
          }

          const payload = {
            amount: Math.round(amount),
            currency: body.currency || "INR",
            receipt: body.receipt || `rcpt_${Date.now()}`,
          };

          const res = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              Authorization:
                "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const json = (await res.json()) as {
            id?: string;
            amount?: number;
            currency?: string;
            error?: { description?: string };
          };

          if (!res.ok || !json.id) {
            const status = res.status === 401 ? 401 : 500;
            return Response.json(
              { error: json.error?.description || "Failed to create order" },
              { status },
            );
          }

          return Response.json({
            order_id: json.id,
            amount: json.amount,
            currency: json.currency || "INR",
            key_id: keyId,
          });
        } catch (err) {
          console.error("[api/create-order]", err);
          return Response.json(
            { error: err instanceof Error ? err.message : "Server error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
