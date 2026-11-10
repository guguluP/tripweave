import { createFileRoute } from "@tanstack/react-router";
import { getGroupState } from "@/lib/server/group-trips";

export const Route = createFileRoute("/api/group/$token/state")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const result = await getGroupState({ data: { token: params.token } });
        if (!result.ok) return Response.json({ ok: false }, { status: 404 });
        const version = new URL(request.url).searchParams.get("v");
        if (version && Number(version) === result.state.version) {
          return new Response(null, { status: 304 });
        }
        return Response.json({ state: result.state });
      },
    },
  },
});
