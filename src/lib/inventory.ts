/**
 * TripWeave allotment (simulated).
 * Room counts are a catalog estimate from the room name, not a hotel contract.
 * A night is taken only when a paid or held booking covers it.
 * Festival and weekend prices are the published tariff (Rath Yatra, Diwali,
 * year-end, high season), not a demand simulation.
 * Published festival windows run through 25 Jun 2027. Later dates say so.
 */
export const ALLOTMENT_LABEL = "TripWeave allotment (simulated)";
/** Last night covered by the hardcoded festival list. */
export const FESTIVAL_CALENDAR_END = "2027-06-25";
import { overlayFor } from "./catalog-store.ts";
import { clampNights, getPackage, getRoom, stayTotal, type StayPackage } from "./packages.ts";

export type OccupancyHold = {
  /** Booking id, confirmation code, or Razorpay order id. Two guests on the same dates stay two holds. */
  holdId?: string;
  packageId: string;
  roomId: string;
  checkIn: string;
  nights: number;
  status: string;
  /** Checkout holds expire so an abandoned Razorpay modal does not block the room. */
  expiresAt?: string;
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

function seasonCore(iso: string): { multiplier: number; label: string; kind: "base" | "high" | "weekend" | "festival" } {
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

export function seasonFor(iso: string): { multiplier: number; label: string; kind: "base" | "high" | "weekend" | "festival" } {
  const season = seasonCore(iso);
  if (iso > FESTIVAL_CALENDAR_END && season.kind !== "festival") {
    return { ...season, label: `${season.label} · festival calendar ends Jun 2027` };
  }
  return season;
}

/**
 * Keys TripWeave may sell. A partner override wins. Otherwise suites are 2,
 * premium rooms 3 or 5, value rooms 6, and the rest 4.
 */
export function roomUnits(pkg: StayPackage, roomId: string): number {
  const edited = overlayFor(pkg.id)?.extras?.find((extra) => extra.optionId === `units:${roomId}`);
  if (edited && edited.delta >= 1) return edited.delta;
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
  const next = (g.__twHolds__ ?? []).filter((h) => {
    if (hold.holdId && h.holdId === hold.holdId) return false;
    return true;
  });
  g.__twHolds__ = [hold, ...next];
}

/** Check leftover keys and record a hold with no await between the two, so one isolate cannot double-sell the last key. */
export function tryReserveHold(hold: OccupancyHold): boolean {
  const quote = quoteStay({
    packageId: hold.packageId,
    roomId: hold.roomId,
    checkIn: hold.checkIn,
    nights: hold.nights,
  });
  if (!quote?.available) return false;
  recordHold(hold);
  return true;
}

/** Replace in-memory holds with the paid rows stored in Supabase. */
export function replacePaidHolds(holds: OccupancyHold[]) {
  g.__twHolds__ = holds.filter((h) => h.status === "paid" || h.status === "held");
}

export function releaseHold(packageId: string, roomId: string, checkIn: string, nights: number, holdId?: string) {
  g.__twHolds__ = (g.__twHolds__ ?? []).map((h) => {
    if (holdId) return h.holdId === holdId ? { ...h, status: "cancelled" } : h;
    return h.packageId === packageId && h.roomId === roomId && h.checkIn === checkIn && h.nights === nights
      ? { ...h, status: "cancelled" }
      : h;
  });
}

export function releaseHoldById(holdId: string) {
  g.__twHolds__ = (g.__twHolds__ ?? []).map((h) =>
    h.holdId === holdId ? { ...h, status: "cancelled" } : h,
  );
}

function holdIsLive(hold: OccupancyHold, now = Date.now()) {
  if (hold.status !== "paid" && hold.status !== "held") return false;
  if (hold.expiresAt && Date.parse(hold.expiresAt) <= now) return false;
  return true;
}

function nightsOverlap(hold: OccupancyHold, date: string) {
  if (!holdIsLive(hold)) return false;
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
  for (const [index, h] of [...listHolds(), ...extraHolds].entries()) {
    if (h.packageId !== packageId || h.roomId !== roomId || !nightsOverlap(h, date)) continue;
    const key = h.holdId ?? `row:${index}:${h.checkIn}:${h.nights}`;
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
