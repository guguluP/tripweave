import { createFileRoute } from "@tanstack/react-router";
import { unauthorizedCron } from "@/lib/server/cron-auth";
import { runGroupSweep } from "@/lib/server/group-sweep";

/** Daily backstop. Deadlines also lapse when someone opens the group. */
export const Route = createFileRoute("/api/cron/group-sweep")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = unauthorizedCron(request);
        if (denied) return denied;
        return Response.json(await runGroupSweep());
      },
      POST: async ({ request }) => {
        const denied = unauthorizedCron(request);
        if (denied) return denied;
        return Response.json(await runGroupSweep());
      },
    },
  },
});
