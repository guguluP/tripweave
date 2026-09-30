import { useEffect, useState } from "react";
import { mergeAllotment, mergeStopSell } from "@/lib/allotment-store";
import { addDays, replacePaidHolds, type OccupancyHold } from "@/lib/inventory";
import { loadOccupancy, loadStayInventory } from "@/lib/server/occupancy";

export type InventoryStatus = "loading" | "ready" | "failed";

/** Paid and held rooms from Supabase, so leftover counts match the reservation book. */
export function usePaidHolds(): OccupancyHold[] {
  const [holds, setHolds] = useState<OccupancyHold[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadOccupancy()
      .then((rows) => {
        if (cancelled) return;
        replacePaidHolds(rows);
        setHolds(rows);
      })
      .catch(() => {
        if (!cancelled) setHolds([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return holds;
}

/**
 * Holds, nightly allotment, and stop-sell for one stay.
 * A failed read leaves the previous book alone and reports failed,
 * so the page must not print a leftover count.
 */
export function useStayInventory(packageId: string | undefined, checkIn: string, nights: number): InventoryStatus {
  const [status, setStatus] = useState<InventoryStatus>("loading");
  useEffect(() => {
    if (!packageId || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || nights < 1) return;
    let cancelled = false;
    setStatus("loading");
    const from = checkIn;
    const to = addDays(checkIn, nights - 1);
    loadStayInventory({ data: { packageId, from, to } })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setStatus("failed");
          return;
        }
        mergeAllotment(packageId, from, to, result.allotment);
        mergeStopSell(packageId, from, to, result.stopSell);
        replacePaidHolds(result.holds);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [packageId, checkIn, nights]);
  return status;
}
