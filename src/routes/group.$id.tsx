import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GroupTripView } from "@/components/group-trip-view";
import { RequireAuth } from "@/components/require-auth";
import { Shell } from "@/components/shell";
import { pageHead } from "@/lib/page-title";
import { getGroupState } from "@/lib/server/group-trips";
import type { PublicGroup } from "@/lib/group/view";

export const Route = createFileRoute("/group/$id")({
  component: OrganiserGroup,
  head: () => pageHead("Group trip"),
});

function OrganiserGroup() {
  const { id } = Route.useParams();
  return (
    <RequireAuth next={`/group/${id}`} fallback={<Shell><p className="p-8">Checking sign-in…</p></Shell>}>
      <Body id={id} />
    </RequireAuth>
  );
}

function Body({ id }: { id: string }) {
  const [state, setState] = useState<PublicGroup | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void getGroupState({ data: { tripId: id } }).then((res) => {
      if (res.ok) setState(res.state);
      else setMessage(res.message);
    });
  }, [id]);
  return (
    <Shell>
      {state ? <GroupTripView state={state} onChange={setState} /> : <p className="px-4 py-16">{message || "Loading the group…"}</p>}
    </Shell>
  );
}
