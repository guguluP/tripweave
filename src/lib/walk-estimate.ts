import { LANDMARKS, stayPin } from "./places.ts";

const EARTH_KM = 6371;
/** Calm walking pace used for guest-facing estimates. */
export const WALK_PACE_KMH = 5;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Whole minutes at ~5 km/h. Returns null for non-finite distances. */
export function walkMinutesFromKm(km: number, paceKmh = WALK_PACE_KMH): number | null {
  if (!Number.isFinite(km) || km < 0 || paceKmh <= 0) return null;
  return Math.max(1, Math.round((km / paceKmh) * 60));
}

export type StayWalkTimes = {
  templeMinutes: number | null;
  stationMinutes: number | null;
  beachMinutes: number | null;
  templeKm: number | null;
  stationKm: number | null;
  beachKm: number | null;
};

/** Walking-time estimates from stay coordinates to known landmarks. */
export function stayWalkTimes(packageId: string, name = packageId): StayWalkTimes | null {
  const stay = stayPin(packageId, name);
  if (!stay) return null;
  const temple = LANDMARKS.find((p) => p.id === "temple");
  const station = LANDMARKS.find((p) => p.id === "station");
  const beach = LANDMARKS.find((p) => p.id === "beach");
  const templeKm = temple ? haversineKm(stay, temple) : null;
  const stationKm = station ? haversineKm(stay, station) : null;
  const beachKm = beach ? haversineKm(stay, beach) : null;
  return {
    templeKm,
    stationKm,
    beachKm,
    templeMinutes: templeKm != null ? walkMinutesFromKm(templeKm) : null,
    stationMinutes: stationKm != null ? walkMinutesFromKm(stationKm) : null,
    beachMinutes: beachKm != null ? walkMinutesFromKm(beachKm) : null,
  };
}
