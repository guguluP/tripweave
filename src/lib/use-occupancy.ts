import { useEffect, useState } from "react";
import { replacePaidHolds, type OccupancyHold } from "@/lib/inventory";
import { loadOccupancy } from "@/lib/server/occupancy";

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
        /* quote still uses this process's holds */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return holds;
}
