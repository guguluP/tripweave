import { getSupabaseAdmin } from "@/lib/supabase/server";
import { loadGroup, mutateGroup } from "@/lib/server/group-store";

/** One desk action for every room in the group. */
export async function settleGroupDesk(input: {
  tripId: string;
  packageId: string;
  action: "desk_confirm" | "desk_decline";
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const doc = await loadGroup({ tripId: input.tripId });
  if (!doc || doc.trip.lockedPackageId !== input.packageId) {
    return { ok: false, message: "That group is not waiting on this hotel." };
  }
  const result = await mutateGroup({ tripId: input.tripId }, "desk_result", { action: input.action });
  if (!result.ok) return { ok: false, message: "The group could not be updated. Refresh and try again." };
  const sb = getSupabaseAdmin();
  if (sb) {
    const status = input.action === "desk_confirm" ? "desk_confirmed" : "cancelled";
    const { error } = await sb.from("bookings").update({ status }).eq("group_trip_id", input.tripId).eq("status", "paid");
    if (error && !/group_trip_id/i.test(error.message)) console.error("[group desk]", error.message);
  }
  return {
    ok: true,
    message: input.action === "desk_confirm" ? "Hotel confirmed for the whole group." : "Declined. Refunds are queued.",
  };
}

/** The organiser cancelled the trip: every room row goes back to the hotel, paid or confirmed. */
export async function cancelGroupRoomBookings(tripId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("group_trip_id", tripId)
    .in("status", ["paid", "desk_confirmed"]);
  if (error && !/group_trip_id/i.test(error.message)) console.error("[group cancel]", error.message);
}
