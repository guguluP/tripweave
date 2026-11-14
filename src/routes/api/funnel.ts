import { createFileRoute } from "@tanstack/react-router";
import { recordFunnelEvent } from "@/lib/server/funnel";
import { allowRequest } from "@/lib/server/rate-limit";

/** Events the browser sends through `track()` in src/lib/analytics.ts. */
const BROWSER_EVENTS = new Set(["brief_completed", "match_clicked", "checkout_opened", "paid"]);

export const Route = createFileRoute("/api/funnel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!allowRequest("funnel", 60, 60_000)) {
          return Response.json({ ok: false }, { status: 429 });
        }
        let body: { event?: string; packageId?: string } = {};
        try {
          body = (await request.json()) as { event?: string; packageId?: string };
        } catch {
          return Response.json({ ok: false }, { status: 400 });
        }
        // Server-side milestones (webhook bookings, group publish/paid) are recorded by the
        // server itself. Accepting them here let anyone inflate those counts.
        if (!BROWSER_EVENTS.has(body.event ?? "")) return Response.json({ ok: false }, { status: 400 });
        await recordFunnelEvent(body.event ?? "", typeof body.packageId === "string" ? body.packageId : undefined);
        return Response.json({ ok: true });
      },
    },
  },
});
