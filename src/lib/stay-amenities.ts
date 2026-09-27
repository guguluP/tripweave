import type { StayPackage } from "./packages.ts";
import { stayWalkTimes } from "./walk-estimate.ts";

export type AmenityFact = {
  id: string;
  label: string;
  value: string;
};

/**
 * Amenity facts that already exist in catalog / coordinates.
 * Omits generator, lift, and extra-bed when the catalog has no field —
 * do not invent those.
 */
export function stayAmenityFacts(pkg: StayPackage): AmenityFact[] {
  const facts: AmenityFact[] = [];
  const walks = stayWalkTimes(pkg.id, pkg.name);

  if (walks?.templeMinutes != null) {
    facts.push({
      id: "darshan",
      label: "Darshan walk",
      value: `~${walks.templeMinutes} min to Jagannath Temple (estimate)`,
    });
  }
  if (walks?.beachMinutes != null) {
    facts.push({
      id: "beach",
      label: "Beach walk",
      value: `~${walks.beachMinutes} min to the sand (estimate)`,
    });
  }
  if (walks?.stationMinutes != null) {
    facts.push({
      id: "station",
      label: "Station walk",
      value: `~${walks.stationMinutes} min to Puri station (estimate)`,
    });
  }

  const parking = pkg.includes.find((line) => /parking/i.test(line));
  if (parking) {
    facts.push({ id: "parking", label: "Parking", value: parking });
  }

  // generator / lift / extra-bed: no structured catalog fields yet — omit.

  return facts;
}

/** Property gallery is "limited" when the hotel published few frames. */
export const LIMITED_PHOTO_BELOW = 4;

export function isLimitedPhotoSet(imageCount: number): boolean {
  return imageCount > 0 && imageCount < LIMITED_PHOTO_BELOW;
}
