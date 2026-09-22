export type ExtraOverride = { optionId: string; delta: number; label?: string };

export type CatalogOverlay = {
  packageId: string;
  pricePerNight?: number | null;
  image?: string | null;
  extras?: ExtraOverride[];
  guestRating?: number | null;
  guestCount?: number;
};

let rows: CatalogOverlay[] = [];
const listeners = new Set<() => void>();

export function catalogOverlays() {
  return rows;
}

export function overlayFor(packageId: string) {
  return rows.find((row) => row.packageId === packageId) ?? null;
}

export function setCatalogOverlays(next: CatalogOverlay[]) {
  rows = next;
  for (const listener of listeners) listener();
}

export function subscribeCatalog(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
