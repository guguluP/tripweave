import { createFileRoute } from "@tanstack/react-router";
import { unauthorizedCron } from "@/lib/server/cron-auth";
import { runReconcileUnbookedCron } from "@/lib/server/reconcile-unbooked";

/** Daily: captured Razorpay payments with no TripWeave booking → ops email. */
export const Route = createFileRoute("/api/cron/reconcile-unbooked")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = unauthorizedCron(request);
        if (denied) return denied;
        try {
          return Response.json(await runReconcileUnbookedCron());
        } catch (err) {
          console.error("[cron] reconcile-unbooked", err);
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "reconcile cron failed" },
            { status: 500 },
          );
        }
      },
      POST: async ({ request }) => {
        const denied = unauthorizedCron(request);
        if (denied) return denied;
        try {
          return Response.json(await runReconcileUnbookedCron());
        } catch (err) {
          console.error("[cron] reconcile-unbooked", err);
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "reconcile cron failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
