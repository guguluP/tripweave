import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GroupTripView } from "@/components/group-trip-view";
import { Shell } from "@/components/shell";
import { getGroupState } from "@/lib/server/group-trips";
import type { PublicGroup } from "@/lib/group/view";

const ORIGIN = "https://tripweave-web.vercel.app";

/** Same bounds as the server validator (16–80 characters). */
function looksLikeGroupToken(token: string): boolean {
  return token.length >= 16 && token.length <= 80;
}

export const Route = createFileRoute("/g/$token")({
  // A mistyped or truncated link must show "not a group", not a 500 with the validator's JSON.
  loader: async ({ params }) =>
    looksLikeGroupToken(params.token)
      ? getGroupState({ data: { token: params.token } })
      : ({ ok: false as const, message: "This link is not a TripWeave group." }),
  head: ({ loaderData }) => {
    const state = loaderData?.ok ? loaderData.state : null;
    const people = state ? state.adults + state.children : 0;
    const title = state ? `${state.title} · ${state.checkIn} · ${people} people` : "TripWeave group";
    const description = state?.hotelName
      ? `${state.hotelName}. Each person pays their own share.`
      : "A Puri group trip. The shortlist is visible before you join.";
    return {
      meta: [
        { title },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: `${ORIGIN}/og.jpg` },
      ],
    };
  },
  component: GroupPage,
});

function GroupPage() {
  const { token } = Route.useParams();
  const initial = Route.useLoaderData();
  const [state, setState] = useState<PublicGroup | null>(initial.ok ? initial.state : null);
  const [message, setMessage] = useState(initial.ok ? "" : initial.message);
  if (!state) {
    return (
      <Shell>
        <p className="mx-auto max-w-xl px-4 py-16">{message || "This link is not a TripWeave group."}</p>
      </Shell>
    );
  }
  return (
    <Shell>
      <GroupTripView state={state} token={token} onChange={setState} />
      {message ? <p className="sr-only">{message}</p> : null}
    </Shell>
  );
}
