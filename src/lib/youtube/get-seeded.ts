import type { PackageReviewConsensus } from "./types.ts";
import { SEED_CONSENSUS } from "./seed.ts";
import { TAJ_PURI_ROOM_NOTES } from "./taj-puri-room-notes.ts";

export function getSeededConsensus(
  packageId: string,
): PackageReviewConsensus | null {
  const c = SEED_CONSENSUS[packageId] ?? null;
  if (!c) return null;
  if (packageId === "taj-puri-resort-spa") {
    return { ...c, roomNotes: TAJ_PURI_ROOM_NOTES };
  }
  return c;
}

export function listSeededPackageIds() {
  return Object.keys(SEED_CONSENSUS);
}

export { SEED_CONSENSUS };
