import { createFileRoute } from "@tanstack/react-router";

/** Public verify endpoint is closed. Signature checks run inside createBooking. */
export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { error: "Gone. Payment verification is part of authenticated booking." },
          { status: 410 },
        ),
      GET: async () =>
        Response.json(
          { error: "Gone. Payment verification is part of authenticated booking." },
          { status: 410 },
        ),
    },
  },
});
