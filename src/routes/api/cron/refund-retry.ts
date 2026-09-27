import { createFileRoute } from "@tanstack/react-router";
import { unauthorizedCron } from "@/lib/server/cron-auth";
import { runRefundRetryCron } from "@/lib/server/refund-cron";

/** Hourly: retry pending / gateway_done refunds without waiting for My trips. */
export const Route = createFileRoute("/api/cron/refund-retry")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = unauthorizedCron(request);
        if (denied) return denied;
        try {
          return Response.json(await runRefundRetryCron());
        } catch (err) {
          console.error("[cron] refund-retry", err);
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "refund cron failed" },
            { status: 500 },
          );
        }
      },
      POST: async ({ request }) => {
        const denied = unauthorizedCron(request);
        if (denied) return denied;
        try {
          return Response.json(await runRefundRetryCron());
        } catch (err) {
          console.error("[cron] refund-retry", err);
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "refund cron failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
