/**
 * Contracted Puri allotment.
 * Each room type has a fixed number of keys TripWeave can sell.
 * A night is taken only when a paid or held booking covers it.
 * Festival and weekend prices are the published tariff (Rath Yatra, Diwali,
 * year-end, high season), not a demand simulation.
 */
import { clampNights, getPackage, getRoom, stayTotal, type StayPackage } from "./packages.ts";

export type OccupancyHold = {
  packageId: string;
  roomId: string;
  checkIn: string;
  nights: number;
  status: string;
};

export type NightQuote = {
  date: string;
  rate: number;
  label: string;
  remaining: number;
};

export type StayQuote = {
  packageId: string;
  roomId: string;
  checkIn: string;
  nights: number;
  occupancy: number;
  units: number;
  nightsQuoted: NightQuote[];
  extras: number;
  perPerson: number;
  remaining: number;
  available: boolean;
  soldOutNights: string[];
};

const FESTIVAL = [
  ["2026-06-26", "2026-07-06"], // Rath Yatra 2026
  ["2026-10-19", "2026-10-22"], // Diwali week
  ["2026-12-28", "2027-01-02"],
  ["2027-06-15", "2027-06-25"],
];

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function eachNight(checkIn: string, nights: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < nights; i++) out.push(addDays(checkIn, i));
  return out;
}

export function todayIso(now = new Date()) {
  return isoDate(now);
}

function inRange(iso: string, start: string, end: string) {
  return iso >= start && iso <= end;
}

export function seasonFor(iso: string): { multiplier: number; label: string; kind: "base" | "high" | "weekend" | "festival" } {
  for (const [start, end] of FESTIVAL) {
    if (inRange(iso, start, end)) return { multiplier: 1.45, label: "Festival", kind: "festival" };
  }
  const d = new Date(`${iso}T12:00:00`);
  const month = d.getMonth() + 1;
  const dow = d.getDay();
  const high = month >= 10 || month <= 2;
  if (dow === 5 || dow === 6) {
    return {
      multiplier: high ? 1.28 : 1.12,
      label: high ? "High season weekend" : "Weekend",
      kind: "weekend",
    };
  }
  if (high) return { multiplier: 1.18, label: "High season", kind: "high" };
  return { multiplier: 1, label: "Standard", kind: "base" };
}

/** How many physical keys of this room type TripWeave is allowed to sell. */
export function roomUnits(pkg: StayPackage, roomId: string): number {
  const room = getRoom(pkg, roomId);
  const suite = /suite|villa|cottage/i.test(room.name);
  if (suite) return 2;
  if (room.occupancy >= 5) return 2;
  if (pkg.budget === "premium") return room.occupancy >= 4 ? 3 : 5;
  if (pkg.budget === "value") return 6;
  return 4;
}

const g = globalThis as typeof globalThis & { __twHolds__?: OccupancyHold[] };
if (!g.__twHolds__) g.__twHolds__ = [];

export function listHolds(): OccupancyHold[] {
  return g.__twHolds__ ?? [];
}

export function recordHold(hold: OccupancyHold) {
  const next = (g.__twHolds__ ?? []).filter(
    (h) =>
      !(
        h.packageId === hold.packageId &&
        h.roomId === hold.roomId &&
        h.checkIn === hold.checkIn &&
        h.nights === hold.nights &&
        h.status === "paid"
      ),
  );
  g.__twHolds__ = [hold, ...next];
}

/** Replace in-memory holds with the paid rows stored in Supabase. */
export function replacePaidHolds(holds: OccupancyHold[]) {
  g.__twHolds__ = holds.filter((h) => h.status === "paid" || h.status === "held");
}

export function releaseHold(packageId: string, roomId: string, checkIn: string, nights: number) {
  g.__twHolds__ = (g.__twHolds__ ?? []).map((h) =>
    h.packageId === packageId && h.roomId === roomId && h.checkIn === checkIn && h.nights === nights
      ? { ...h, status: "cancelled" }
      : h,
  );
}

function nightsOverlap(hold: OccupancyHold, date: string) {
  if (hold.status !== "paid" && hold.status !== "held") return false;
  const holdNights = eachNight(hold.checkIn, hold.nights);
  return holdNights.includes(date);
}

export function takenOnNight(
  packageId: string,
  roomId: string,
  date: string,
  extraHolds: OccupancyHold[] = [],
): number {
  const pkg = getPackage(packageId);
  if (!pkg) return 0;
  const units = roomUnits(pkg, roomId);
  const seen = new Set<string>();
  let held = 0;
  for (const h of [...listHolds(), ...extraHolds]) {
    if (h.packageId !== packageId || h.roomId !== roomId || !nightsOverlap(h, date)) continue;
    const key = `${h.checkIn}:${h.nights}:${h.status}`;
    if (seen.has(key)) continue;
    seen.add(key);
    held += 1;
  }
  return Math.min(units, held);
}

export function quoteStay(input: {
  packageId: string;
  roomId?: string | null;
  checkIn: string;
  nights: number;
  swaps?: Record<string, string>;
  extraHolds?: OccupancyHold[];
}): StayQuote | null {
  const pkg = getPackage(input.packageId);
  if (!pkg) return null;
  const room = getRoom(pkg, input.roomId);
  const nights = clampNights(pkg, input.nights);
  const units = roomUnits(pkg, room.id);
  const dates = eachNight(input.checkIn, nights);
  const nightsQuoted: NightQuote[] = dates.map((date) => {
    const season = seasonFor(date);
    const remaining = Math.max(0, units - takenOnNight(pkg.id, room.id, date, input.extraHolds));
    const rate = Math.round((pkg.pricePerNight + room.deltaPerNight) * season.multiplier);
    return { date, rate, label: season.label, remaining };
  });
  const extras = stayTotal(pkg, nights, room.id, input.swaps ?? {}) - (pkg.pricePerNight + room.deltaPerNight) * nights;
  const roomSum = nightsQuoted.reduce((s, n) => s + n.rate, 0);
  const remaining = nightsQuoted.length ? Math.min(...nightsQuoted.map((n) => n.remaining)) : 0;
  const soldOutNights = nightsQuoted.filter((n) => n.remaining <= 0).map((n) => n.date);
  return {
    packageId: pkg.id,
    roomId: room.id,
    checkIn: input.checkIn,
    nights,
    occupancy: room.occupancy,
    units,
    nightsQuoted,
    extras,
    perPerson: roomSum + extras,
    remaining,
    available: soldOutNights.length === 0 && remaining > 0,
    soldOutNights,
  };
}

export function leftoverForRooms(
  packageId: string,
  checkIn: string,
  nights: number,
  extraHolds: OccupancyHold[] = [],
): Record<string, { remaining: number; available: boolean; occupancy: number }> {
  const pkg = getPackage(packageId);
  const out: Record<string, { remaining: number; available: boolean; occupancy: number }> = {};
  if (!pkg) return out;
  for (const room of pkg.rooms) {
    const q = quoteStay({
      packageId,
      roomId: room.id,
      checkIn,
      nights,
      extraHolds,
    });
    out[room.id] = {
      remaining: q?.remaining ?? 0,
      available: q?.available ?? false,
      occupancy: room.occupancy,
    };
  }
  return out;
}

export function travelersFitRoom(occupancy: number, travelers: number) {
  return travelers >= 1 && travelers <= occupancy;
}
