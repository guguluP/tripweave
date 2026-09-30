export type Pin = { id: string; label: string; lat: number; lng: number; kind: "stay" | "temple" | "station" | "beach" };

/**
 * Hotel nodes are OpenStreetMap centres (Sept 2026), except Mahodadhi Palace
 * (Wikimapia 19°47'41"N 85°49'15"E, Sea Beach Road near Swargadwar) and
 * Holiday Resort (published pin 19.801556, 85.841305 on Chakratirtha Road).
 */
export const LANDMARKS: Pin[] = [
  { id: "temple", label: "Jagannath Temple", lat: 19.804773, lng: 85.818081, kind: "temple" },
  { id: "station", label: "Puri railway station", lat: 19.810297, lng: 85.841546, kind: "station" },
  { id: "beach", label: "Puri sea beach", lat: 19.7946, lng: 85.8248, kind: "beach" },
];

export const GATEWAYS = {
  bbi: { lat: 20.252295, lng: 85.813485, label: "Biju Patnaik Airport, Bhubaneswar" },
  bus: { lat: 19.815701, lng: 85.837939, label: "Puri Bus Stand" },
};

const STAYS: Record<string, { lat: number; lng: number }> = {
  "taj-puri-resort-spa": { lat: 19.784453, lng: 85.786158 },
  "mayfair-heritage-puri": { lat: 19.798509, lng: 85.833763 },
  "swosti-premium-beach-resort": { lat: 19.78643, lng: 85.793724 },
  "mayfair-waves-puri": { lat: 19.798695, lng: 85.834441 },
  "toshali-sands-puri": { lat: 19.839589, lng: 85.891856 },
  "chariot-resort-puri": { lat: 19.784814, lng: 85.78503 },
  "chanakya-bnr-puri": { lat: 19.80205, lng: 85.838194 },
  "mahodadhi-palace-puri": { lat: 19.794722, lng: 85.820833 },
  "holiday-resort-puri": { lat: 19.801556, lng: 85.841305 },
  "regenta-central-puri": { lat: 19.786898, lng: 85.797065 },
  "hans-coco-palms": { lat: 19.789746, lng: 85.805063 },
  "empires-hotel-puri": { lat: 19.786711, lng: 85.795226 },
};

export function stayPin(packageId: string, name: string): Pin | null {
  const at = STAYS[packageId];
  if (!at) return null;
  return { id: packageId, label: name, ...at, kind: "stay" };
}

export function mapFrame(pins: Pin[]) {
  const lats = pins.map((p) => p.lat);
  const lngs = pins.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const padLat = Math.max(0.004, (maxLat - minLat) * 0.18);
  const padLng = Math.max(0.004, (maxLng - minLng) * 0.18);
  return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLng: minLng - padLng, maxLng: maxLng + padLng };
}

export function pinPosition(pin: Pin, frame: ReturnType<typeof mapFrame>) {
  const x = ((pin.lng - frame.minLng) / (frame.maxLng - frame.minLng)) * 100;
  const y = ((frame.maxLat - pin.lat) / (frame.maxLat - frame.minLat)) * 100;
  return { left: `${x}%`, top: `${y}%` };
}
