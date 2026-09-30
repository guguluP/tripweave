import { createFileRoute } from "@tanstack/react-router";
import { recordFunnelEvent } from "@/lib/server/funnel";
import { allowRequest } from "@/lib/server/rate-limit";

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
        await recordFunnelEvent(body.event ?? "", body.packageId);
        return Response.json({ ok: true });
      },
    },
  },
});
