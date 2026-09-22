import { createFileRoute } from "@tanstack/react-router";

/** Public amount-in-body order minting is closed. Use createRazorpayOrder. */
export const Route = createFileRoute("/api/create-order")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { error: "Gone. Authenticated stay quotes create Razorpay orders." },
          { status: 410 },
        ),
      GET: async () =>
        Response.json(
          { error: "Gone. Authenticated stay quotes create Razorpay orders." },
          { status: 410 },
        ),
    },
  },
});
