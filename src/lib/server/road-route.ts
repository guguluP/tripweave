import type { RoadLeg } from "@/lib/visit-places";

export type { RoadLeg };

type Stop = { id: string; lat: number; lng: number };

const TTL_MS = 30 * 60_000;
const cache = new Map<string, { at: number; legs: RoadLeg[] }>();

function keyFor(origin: Stop, places: Stop[]): string {
  const from = `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`;
  const to = places.map((place) => place.id).join(",");
  return `${from}|${to}`;
}

/** One driving table from the public road router. Distance is metres, duration is seconds. */
export async function roadLegs(origin: Stop, places: Stop[], now = Date.now()): Promise<RoadLeg[]> {
  if (places.length === 0) return [];
  const key = keyFor(origin, places);
  const hit = cache.get(key);
  if (hit && now - hit.at >= 0 && now - hit.at < TTL_MS) return hit.legs;
  const legs = await loadLegs(origin, places);
  cache.set(key, { at: now, legs });
  return legs;
}

async function loadLegs(origin: Stop, places: Stop[]): Promise<RoadLeg[]> {
  const coords = [origin, ...places].map((pin) => `${pin.lng},${pin.lat}`).join(";");
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance,duration`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return [];
    const json = (await response.json()) as {
      code?: string;
      distances?: (number | null)[][];
      durations?: (number | null)[][];
    };
    if (json.code !== "Ok") return [];
    const distances = json.distances?.[0] ?? [];
    const durations = json.durations?.[0] ?? [];
    const legs: RoadLeg[] = [];
    places.forEach((place, index) => {
      const metres = distances[index + 1];
      const seconds = durations[index + 1];
      if (metres == null || seconds == null || !Number.isFinite(metres) || metres <= 0) return;
      legs.push({
        id: place.id,
        km: Math.round((metres / 1000) * 10) / 10,
        driveMinutes: Math.max(1, Math.round(seconds / 60)),
      });
    });
    return legs;
  } catch {
    return [];
  }
}
