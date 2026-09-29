import { createFileRoute } from "@tanstack/react-router";
import { unauthorizedCron } from "@/lib/server/cron-auth";
import { runFlagUnconfirmedCron } from "@/lib/server/flag-unconfirmed";

/** Every 10 minutes: flag paid bookings still unconfirmed after TW_DESK_CONFIRM_MINUTES (15–30). */
export const Route = createFileRoute("/api/cron/flag-unconfirmed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = unauthorizedCron(request);
        if (denied) return denied;
        try {
          return Response.json(await runFlagUnconfirmedCron());
        } catch (err) {
          console.error("[cron] flag-unconfirmed", err);
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "flag cron failed" },
            { status: 500 },
          );
        }
      },
      POST: async ({ request }) => {
        const denied = unauthorizedCron(request);
        if (denied) return denied;
        try {
          return Response.json(await runFlagUnconfirmedCron());
        } catch (err) {
          console.error("[cron] flag-unconfirmed", err);
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "flag cron failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
