/**
 * In-memory fallback for per-night units and stop-sell when Supabase is offline.
 * Durable source of truth is room_allotment / stop_sell (see supabase/partner_desk_ops.sql).
 */

export type NightAllotment = {
  packageId: string;
  roomId: string;
  night: string;
  units: number;
};

export type StopSellRow = {
  packageId: string;
  /** Empty string = whole property for that night. */
  roomId: string;
  night: string;
  reason?: string;
};

const g = globalThis as typeof globalThis & {
  __twAllotment__?: NightAllotment[];
  __twStopSell__?: StopSellRow[];
};

if (!g.__twAllotment__) g.__twAllotment__ = [];
if (!g.__twStopSell__) g.__twStopSell__ = [];

export function listAllotment(): NightAllotment[] {
  return g.__twAllotment__ ?? [];
}

export function listStopSell(): StopSellRow[] {
  return g.__twStopSell__ ?? [];
}

export function setNightUnits(row: NightAllotment) {
  const next = (g.__twAllotment__ ?? []).filter(
    (r) => !(r.packageId === row.packageId && r.roomId === row.roomId && r.night === row.night),
  );
  // units 0 is a real stop (no keys that night); negative clears the override
  if (row.units >= 0) next.push(row);
  g.__twAllotment__ = next;
}

export function setStopSell(row: StopSellRow, closed: boolean) {
  const next = (g.__twStopSell__ ?? []).filter(
    (r) => !(r.packageId === row.packageId && r.roomId === row.roomId && r.night === row.night),
  );
  if (closed) next.push(row);
  g.__twStopSell__ = next;
}

export function replaceAllotment(rows: NightAllotment[]) {
  g.__twAllotment__ = rows;
}

export function replaceStopSell(rows: StopSellRow[]) {
  g.__twStopSell__ = rows;
}

/** Replace one property's rows inside a date window. Other hotels stay put. */
export function mergeAllotment(packageId: string, from: string, to: string, rows: NightAllotment[]) {
  const kept = (g.__twAllotment__ ?? []).filter(
    (r) => !(r.packageId === packageId && r.night >= from && r.night <= to),
  );
  g.__twAllotment__ = [...kept, ...rows];
}

export function mergeStopSell(packageId: string, from: string, to: string, rows: StopSellRow[]) {
  const kept = (g.__twStopSell__ ?? []).filter(
    (r) => !(r.packageId === packageId && r.night >= from && r.night <= to),
  );
  g.__twStopSell__ = [...kept, ...rows];
}

export function unitsOverride(packageId: string, roomId: string, night: string): number | null {
  const hit = (g.__twAllotment__ ?? []).find(
    (r) => r.packageId === packageId && r.roomId === roomId && r.night === night,
  );
  return hit ? hit.units : null;
}

export function isDateStopSell(packageId: string, roomId: string, night: string): boolean {
  return (g.__twStopSell__ ?? []).some(
    (r) =>
      r.packageId === packageId &&
      r.night === night &&
      (r.roomId === "" || r.roomId === roomId),
  );
}
