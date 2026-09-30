import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { mergeAllotment, mergeStopSell, type NightAllotment, type StopSellRow } from "@/lib/allotment-store";
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
  const { allowRequest } = await import("@/lib/server/rate-limit");
  if (!allowRequest("occupancy", 40, 60_000)) {
    throw new Error("Too many occupancy reads. Try again in a minute.");
  }
  return refreshOccupancy();
});

function asRows(data: unknown): unknown[] {
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return Array.isArray(parsed) ? parsed : [];
}

function nightOf(value: unknown) {
  return String(value ?? "").slice(0, 10);
}

/** Load holds plus this property's allotment and stop-sell into this process. */
export async function refreshStayInventory(
  packageId: string,
  from: string,
  to: string,
): Promise<{ ok: boolean; holds: OccupancyHold[] }> {
  if (!isSupabaseConfigured()) {
    const holds = await refreshOccupancy();
    mergeAllotment(packageId, from, to, []);
    mergeStopSell(packageId, from, to, []);
    return { ok: true, holds };
  }
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, holds: [] };
  const payload = { package_id: packageId, from, to };
  const [holdsResult, allotmentResult, stopResult] = await Promise.all([
    sb.rpc("tw_occupancy", { p_gate: SUPABASE_WRITE_GATE }),
    sb.rpc("tw_list_allotment", { p_gate: SUPABASE_WRITE_GATE, p_payload: payload }),
    sb.rpc("tw_list_stop_sell", { p_gate: SUPABASE_WRITE_GATE, p_payload: payload }),
  ]);
  if (holdsResult.error || allotmentResult.error || stopResult.error) {
    console.warn(
      "[inventory] stay",
      holdsResult.error?.message ?? allotmentResult.error?.message ?? stopResult.error?.message,
    );
    return { ok: false, holds: [] };
  }
  const holds = mapHolds(holdsResult.data);
  replacePaidHolds(holds);
  const allotment: NightAllotment[] = asRows(allotmentResult.data).flatMap((row) => {
    const rec = row as { packageId?: string; roomId?: string; night?: string; units?: number };
    if (!rec.roomId || !rec.night || rec.units == null) return [];
    return [{ packageId, roomId: rec.roomId, night: nightOf(rec.night), units: Number(rec.units) }];
  });
  const stops: StopSellRow[] = asRows(stopResult.data).flatMap((row) => {
    const rec = row as { roomId?: string; night?: string; reason?: string };
    if (rec.night == null) return [];
    return [{ packageId, roomId: rec.roomId ?? "", night: nightOf(rec.night), reason: rec.reason }];
  });
  mergeAllotment(packageId, from, to, allotment);
  mergeStopSell(packageId, from, to, stops);
  return { ok: true, holds };
}

const windowSchema = (data: unknown) => {
  const row = data as { packageId?: string; from?: string; to?: string };
  if (!row?.packageId || row.packageId.length > 80) throw new Error("Bad inventory window");
  if (!row.from || !row.to || !/^\d{4}-\d{2}-\d{2}$/.test(row.from) || !/^\d{4}-\d{2}-\d{2}$/.test(row.to)) {
    throw new Error("Bad inventory window");
  }
  return { packageId: row.packageId, from: row.from, to: row.to };
};

export const loadStayInventory = createServerFn({ method: "POST" })
  .validator(windowSchema)
  .handler(async ({ data }) => {
    const { allowRequest } = await import("@/lib/server/rate-limit");
    if (!allowRequest("occupancy", 40, 60_000)) {
      throw new Error("Too many occupancy reads. Try again in a minute.");
    }
    const loaded = await refreshStayInventory(data.packageId, data.from, data.to);
    if (!loaded.ok) return { ok: false as const, holds: [] as OccupancyHold[], allotment: [], stopSell: [] };
    return {
      ok: true as const,
      holds: loaded.holds,
      allotment: (await import("@/lib/allotment-store")).listAllotment().filter(
        (r) => r.packageId === data.packageId && r.night >= data.from && r.night <= data.to,
      ),
      stopSell: (await import("@/lib/allotment-store")).listStopSell().filter(
        (r) => r.packageId === data.packageId && r.night >= data.from && r.night <= data.to,
      ),
    };
  });
