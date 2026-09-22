export type Pin = { id: string; label: string; lat: number; lng: number; kind: "stay" | "temple" | "station" | "beach" };

export const LANDMARKS: Pin[] = [
  { id: "temple", label: "Jagannath Temple", lat: 19.8049, lng: 85.818, kind: "temple" },
  { id: "station", label: "Puri railway station", lat: 19.8136, lng: 85.8407, kind: "station" },
  { id: "beach", label: "Puri sea beach", lat: 19.7948, lng: 85.8246, kind: "beach" },
];

const STAYS: Record<string, { lat: number; lng: number }> = {
  "taj-puri-resort-spa": { lat: 19.7865, lng: 85.808 },
  "mayfair-heritage-puri": { lat: 19.7922, lng: 85.8315 },
  "swosti-premium-beach-resort": { lat: 19.7985, lng: 85.8265 },
  "mayfair-waves-puri": { lat: 19.791, lng: 85.8335 },
  "toshali-sands-puri": { lat: 19.868, lng: 85.888 },
  "chariot-resort-puri": { lat: 19.789, lng: 85.815 },
  "chanakya-bnr-puri": { lat: 19.812, lng: 85.838 },
  "mahodadhi-palace-puri": { lat: 19.7988, lng: 85.8248 },
  "holiday-resort-puri": { lat: 19.7975, lng: 85.8235 },
  "regenta-central-puri": { lat: 19.8035, lng: 85.8205 },
  "hans-coco-palms": { lat: 19.7968, lng: 85.8228 },
  "empires-hotel-puri": { lat: 19.8065, lng: 85.8215 },
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
