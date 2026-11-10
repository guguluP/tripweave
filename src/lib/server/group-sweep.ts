import type { GroupDoc } from "@/lib/group/engine";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";
import { loadGroup, mutateGroup } from "@/lib/server/group-store";

/** Lazy expiry on read, plus the daily cron. Payment links are rechecked before a lapse. */
export async function touchGroup(doc: GroupDoc): Promise<GroupDoc> {
  let current = doc;
  const completed = await mutateGroup({ tripId: doc.trip.id }, "complete_if_due", {});
  if (completed.ok && completed.doc) current = completed.doc;

  if (
    current.trip.status === "collecting" &&
    current.trip.payDeadlineAt &&
    Date.parse(current.trip.payDeadlineAt) < Date.now()
  ) {
    const { recheckOpenLinks } = await import("@/lib/server/group-razorpay");
    await recheckOpenLinks(current);
    const expired = await mutateGroup({ tripId: current.trip.id }, "expire", {});
    if (expired.ok && expired.doc) current = expired.doc;
  }

  if (
    current.trip.status === "fully_paid_awaiting_hotel" &&
    current.trip.deskDeadlineAt &&
    Date.parse(current.trip.deskDeadlineAt) < Date.now() &&
    current.trip.lockedPackageId
  ) {
    const { settleGroupDesk } = await import("@/lib/server/group-desk");
    await settleGroupDesk({
      tripId: current.trip.id,
      packageId: current.trip.lockedPackageId,
      action: "desk_decline",
    });
    current = (await loadGroup({ tripId: current.trip.id })) ?? current;
  }

  await mutateGroup({ tripId: current.trip.id }, "scrub_phones", {});
  return (await loadGroup({ tripId: current.trip.id })) ?? current;
}

export async function runGroupSweep(): Promise<{ ok: true; seen: number }> {
  let docs: GroupDoc[] = [];
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (!sb) return { ok: true, seen: 0 };
    const { data } = await sb.rpc("tw_group", { p_gate: SUPABASE_WRITE_GATE, p_op: "list_due", p_payload: {} });
    docs = Array.isArray(data) ? (data as GroupDoc[]) : [];
  } else {
    const { listDeskGroups } = await import("@/lib/server/group-store");
    void listDeskGroups;
    const mem = globalThis as typeof globalThis & { __twGroups__?: { byId: Map<string, GroupDoc> } };
    docs = [...(mem.__twGroups__?.byId.values() ?? [])];
  }
  for (const doc of docs) {
    try {
      await touchGroup(doc);
    } catch (err) {
      console.error("[group sweep]", err instanceof Error ? err.message : "failed");
    }
  }
  return { ok: true, seen: docs.length };
}
