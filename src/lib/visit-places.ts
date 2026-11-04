import { mapplsDirectionUrl } from "./mappls.ts";
import { GATEWAYS, LANDMARKS, type Pin } from "./places.ts";
import { walkMinutesFromKm } from "./walk-estimate.ts";

export type RoadLeg = { id: string; km: number; driveMinutes: number };

export type AskPoint = { lat: number; lng: number; label: string };

type VisitPlace = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  blurb: string;
  tags: string[];
};

const temple = LANDMARKS.find((pin) => pin.id === "temple");
const beach = LANDMARKS.find((pin) => pin.id === "beach");

/** Published pins. Konark and Gundicha are the Wikipedia landmark points. */
const VISIT_PLACES: VisitPlace[] = [
  beach
    ? {
        id: "beach",
        label: beach.label,
        lat: beach.lat,
        lng: beach.lng,
        blurb: "The town beach.",
        tags: ["beach", "sea", "sand", "sunset", "swim"],
      }
    : null,
  temple
    ? {
        id: "temple",
        label: temple.label,
        lat: temple.lat,
        lng: temple.lng,
        blurb: "The main temple. The inner shrine is for Hindus.",
        tags: ["jagannath", "temple", "shrine"],
      }
    : null,
  {
    id: "gundicha",
    label: "Gundicha Temple",
    lat: 19.816917,
    lng: 85.840361,
    blurb: "The Rath Yatra ends here, at the far end of Grand Road.",
    tags: ["gundicha", "garden"],
  },
  {
    id: "konark",
    label: "Konark Sun Temple",
    lat: 19.8875,
    lng: 86.094722,
    blurb: "The stone sun chariot. Chandrabhaga beach is beside it. A half-day by cab, not a walk.",
    tags: ["konark", "sun", "surya", "chandrabhaga", "unesco"],
  },
  {
    id: "station",
    label: "Puri railway station",
    lat: LANDMARKS.find((pin) => pin.id === "station")?.lat ?? 19.810297,
    lng: LANDMARKS.find((pin) => pin.id === "station")?.lng ?? 85.841546,
    blurb: "Trains into Puri.",
    tags: ["station", "train", "railway"],
  },
  {
    id: "bus",
    label: GATEWAYS.bus.label,
    lat: GATEWAYS.bus.lat,
    lng: GATEWAYS.bus.lng,
    blurb: "Town buses, including the Konark road.",
    tags: ["bus", "stand"],
  },
].filter((place): place is VisitPlace => place != null);

const SIGHTS = new Set(["beach", "temple", "gundicha", "konark"]);

const VISIT_WORDS =
  /\b(sight|sightseeing|sights|see|visit|places|place|around|nearby|near|distance|far|map|beach|temple|konark|gundicha|chandrabhaga|trip|outing)\b/i;

export function isVisitQuestion(question: string): boolean {
  if (/\b(refund|cancel|visa|passport|e-?visa|oci|checklist|pickup|desk|confirmed|confirmation)\b/i.test(question)) {
    return false;
  }
  return VISIT_WORDS.test(question);
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1).replace(/\.0$/, "")} km`;
  return `${Math.round(km)} km`;
}

function byRoad(leg: RoadLeg): string {
  if (leg.km <= 6) {
    const walk = walkMinutesFromKm(leg.km);
    return walk != null ? `${formatKm(leg.km)} by road, about ${walk} min on foot` : `${formatKm(leg.km)} by road`;
  }
  return `${formatKm(leg.km)} by road, about ${leg.driveMinutes} min by cab`;
}

function picked(question: string): VisitPlace[] {
  const named = VISIT_PLACES.filter((place) =>
    place.tags.some((tag) => question.toLowerCase().includes(tag)),
  );
  const sights = named.filter((place) => SIGHTS.has(place.id));
  if (sights.length > 0) return sights;
  if (named.length > 0 && !/\b(places|sightseeing|sights|visit|see|around|trip|nearby)\b/i.test(question)) {
    return named;
  }
  return VISIT_PLACES.filter((place) => SIGHTS.has(place.id));
}

export function visitTargets(question: string): { id: string; lat: number; lng: number }[] {
  if (!isVisitQuestion(question)) return [];
  return picked(question).map((place) => ({ id: place.id, lat: place.lat, lng: place.lng }));
}

/** Road distances from the stay, plus pins for the map. */
export function visitReply(
  question: string,
  from: Pin | null,
  roads: RoadLeg[] = [],
): { text: string; markers: AskPoint[] } | null {
  if (!isVisitQuestion(question)) return null;
  const origin = from ?? temple;
  if (!origin) return null;
  const byId = new Map(roads.map((leg) => [leg.id, leg]));
  const places = picked(question)
    .map((place) => ({ place, leg: byId.get(place.id) }))
    .sort((a, b) => (a.leg?.km ?? 10_000) - (b.leg?.km ?? 10_000));
  if (places.length === 0) return null;
  const fromLabel = from ? from.label : "Jagannath Temple";
  const measured = from
    ? `From ${fromLabel}. Distances follow the road.`
    : "Measured from Jagannath Temple, because no hotel is open yet. Distances follow the road.";
  const lines = places.map((row) => {
    if (!row.leg) return `${row.place.label}: road distance is unavailable right now. ${row.place.blurb}`;
    return `${row.place.label} is ${byRoad(row.leg)}. ${row.place.blurb}`;
  });
  const primary = places.find((row) => row.leg)?.place ?? places[0]?.place;
  const mapUrl = primary ? mapplsDirectionUrl(origin, primary) : "";
  const text = `${measured} ${lines.join(" ")}${mapUrl ? ` Directions: ${mapUrl}` : ""}`;
  const markers: AskPoint[] = [
    { lat: origin.lat, lng: origin.lng, label: fromLabel },
    ...places.map((row) => ({ lat: row.place.lat, lng: row.place.lng, label: row.place.label })),
  ];
  return { text, markers };
}

const MAP_MARK = /<!--map:(.*?)-->/;

export function packMap(text: string, markers: AskPoint[]): string {
  if (markers.length === 0) return text.slice(0, 1200);
  const body = markers
    .map((pin) => `${pin.lat},${pin.lng},${encodeURIComponent(pin.label)}`)
    .join("|");
  const mark = `<!--map:${body}-->`;
  const room = Math.max(0, 1200 - mark.length - 1);
  return `${mark}\n${text.slice(0, room)}`;
}

export function unpackMap(text: string): { text: string; markers: AskPoint[] } {
  const match = text.match(MAP_MARK);
  if (!match) return { text, markers: [] };
  const markers = match[1]
    .split("|")
    .map((part) => {
      const [lat, lng, ...rest] = part.split(",");
      const label = decodeURIComponent(rest.join(","));
      const point = { lat: Number(lat), lng: Number(lng), label };
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng) || !label) return null;
      return point;
    })
    .filter((pin): pin is AskPoint => pin != null);
  return { text: text.replace(MAP_MARK, "").trim(), markers };
}
