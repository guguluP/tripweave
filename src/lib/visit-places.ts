import { mapplsDirectionUrl } from "./mappls.ts";
import { GATEWAYS, LANDMARKS, type Pin } from "./places.ts";
import { haversineKm, walkMinutesFromKm } from "./walk-estimate.ts";

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
        tags: ["beach", "sea", "sand", "sunset", "swim", "समुद्र"],
      }
    : null,
  temple
    ? {
        id: "temple",
        label: temple.label,
        lat: temple.lat,
        lng: temple.lng,
        blurb: "The main temple. The inner shrine is for Hindus.",
        tags: ["jagannath", "temple", "shrine", "मंदिर"],
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
    tags: ["konark", "sun", "surya", "chandrabhaga", "unesco", "कोणार्क"],
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
  /\b(sight|sightseeing|sights|see|visit|places|place|around|nearby|near|distance|far|map|beach|temple|konark|gundicha|chandrabhaga|trip|outing)\b|घूम|दर्शन|जगह|नजदीक|नज़दीक|समुद्र|मंदिर|कोणार्क/i;

export function isVisitQuestion(question: string): boolean {
  if (/\b(refund|cancel|visa|passport|e-?visa|oci|checklist|pickup|desk|confirmed|confirmation)\b|रद्द|रिफंड|वीज़ा|पासपोर्ट/i.test(question)) {
    return false;
  }
  return VISIT_WORDS.test(question);
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m`;
  const rounded = km < 10 ? (Math.round(km * 10) / 10).toFixed(1) : String(Math.round(km));
  return `${rounded.replace(/\.0$/, "")} km`;
}

function howToGo(km: number): string {
  const minutes = walkMinutesFromKm(km);
  if (km <= 2.5 && minutes != null) return `about ${minutes} min on foot`;
  if (km <= 6 && minutes != null) return `about ${minutes} min if you walk, or a short cab`;
  return "a cab, not a walk";
}

function picked(question: string): VisitPlace[] {
  const named = VISIT_PLACES.filter((place) =>
    place.tags.some((tag) => question.toLowerCase().includes(tag)),
  );
  const sights = named.filter((place) => SIGHTS.has(place.id));
  if (sights.length > 0) return sights;
  if (named.length > 0 && !/\b(places|sightseeing|sights|visit|see|around|trip|nearby)\b|घूम|दर्शन|जगह/i.test(question)) {
    return named;
  }
  return VISIT_PLACES.filter((place) => SIGHTS.has(place.id));
}

/** Straight-line distances from the stay, plus pins for the map. */
export function visitReply(
  question: string,
  from: Pin | null,
  locale: "en" | "hi" = "en",
): { text: string; markers: AskPoint[] } | null {
  if (!isVisitQuestion(question)) return null;
  const origin = from ?? temple;
  if (!origin) return null;
  const places = picked(question)
    .map((place) => ({ place, km: haversineKm(origin, place) }))
    .filter((row) => row.km > 0.05)
    .sort((a, b) => a.km - b.km);
  if (places.length === 0) return null;
  const fromLabel = from ? from.label : "Jagannath Temple";
  const measured = from
    ? `From ${fromLabel}. Distances are straight-line, not the road.`
    : "Measured from Jagannath Temple, because no hotel is open yet. Distances are straight-line, not the road.";
  const lines = places.map(
    (row) => `${row.place.label} is ${formatKm(row.km)}, ${howToGo(row.km)}. ${row.place.blurb}`,
  );
  const primary = places[0];
  const mapUrl = mapplsDirectionUrl(origin, primary.place);
  const hindi = locale === "hi" ? "दूरियाँ सीधी रेखा की हैं, सड़क की नहीं। " : "";
  const text = `${hindi}${measured} ${lines.join(" ")} Directions: ${mapUrl}`;
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
