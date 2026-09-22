import { createServerFn } from "@tanstack/react-start";
import { replacePaidHolds, type OccupancyHold } from "@/lib/inventory";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";

type HoldRow = {
  packageId?: string;
  roomId?: string;
  checkIn?: string;
  nights?: number;
  status?: string;
};

export async function refreshOccupancy(): Promise<OccupancyHold[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("tw_occupancy", { p_gate: SUPABASE_WRITE_GATE });
  if (error || !Array.isArray(data)) {
    if (error) console.warn("[inventory] occupancy", error.message);
    return [];
  }
  const holds: OccupancyHold[] = (data as HoldRow[])
    .filter((row) => row.packageId && row.roomId && row.checkIn && row.nights)
    .map((row) => ({
      packageId: row.packageId!,
      roomId: row.roomId!,
      checkIn: String(row.checkIn).slice(0, 10),
      nights: Number(row.nights),
      status: row.status === "held" ? "held" : "paid",
    }));
  replacePaidHolds(holds);
  return holds;
}

export const loadOccupancy = createServerFn({ method: "GET" }).handler(async () => {
  return refreshOccupancy();
});
