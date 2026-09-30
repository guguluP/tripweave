import { getSupabaseAdmin } from "@/lib/supabase/server";

const EVENTS = new Set([
  "brief_completed",
  "match_clicked",
  "checkout_opened",
  "paid",
  "webhook_booked",
]);

/** Best-effort row. Missing table or database does not fail the guest path. */
export async function recordFunnelEvent(event: string, packageId?: string | null) {
  if (!EVENTS.has(event)) return;
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from("funnel_events").insert({
    event,
    package_id: packageId?.slice(0, 80) ?? null,
  });
  if (error) console.warn("[funnel]", error.message);
}
