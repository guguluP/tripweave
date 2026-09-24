import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { replacePaidHolds, type OccupancyHold } from "@/lib/inventory";
import { shouldSkipNeon } from "@/lib/server/db-fallback";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SUPABASE_WRITE_GATE } from "@/lib/supabase/write-gate";

type HoldRow = {
  holdId?: string;
  packageId?: string;
  roomId?: string;
  checkIn?: string;
  nights?: number;
  status?: string;
  expiresAt?: string | null;
};

/** Stable dedupe key. The raw id can be a confirmation code and must not reach the browser. */
function publicHoldId(raw: string) {
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

function mapHolds(data: unknown): OccupancyHold[] {
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  if (!Array.isArray(parsed)) return [];
  return (parsed as HoldRow[])
    .filter((row) => row.packageId && row.roomId && row.checkIn && row.nights)
    .map((row, index) => ({
      holdId: publicHoldId(row.holdId || `booking:${index}:${row.checkIn}:${row.nights}`),
      packageId: row.packageId!,
      roomId: row.roomId!,
      checkIn: String(row.checkIn).slice(0, 10),
      nights: Number(row.nights),
      status: row.status === "held" ? "held" : "paid",
      expiresAt: row.expiresAt ? String(row.expiresAt) : undefined,
    }));
}

export async function refreshOccupancy(): Promise<OccupancyHold[]> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseAdmin();
    if (!sb) return [];
    const { data, error } = await sb.rpc("tw_occupancy", { p_gate: SUPABASE_WRITE_GATE });
    if (error) {
      console.warn("[inventory] occupancy", error.message);
      return [];
    }
    const holds = mapHolds(data);
    replacePaidHolds(holds);
    return holds;
  }
  if (shouldSkipNeon()) return [];
  try {
    const sql = await getSql();
    const rows = await sql<{ data: unknown }>`select tw_occupancy() as data`;
    const holds = mapHolds(rows[0]?.data);
    replacePaidHolds(holds);
    return holds;
  } catch (err) {
    console.warn("[inventory] occupancy", err instanceof Error ? err.message : err);
    return [];
  }
}

export const loadOccupancy = createServerFn({ method: "GET" }).handler(async () => {
  return refreshOccupancy();
});
