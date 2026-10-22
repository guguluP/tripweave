import { readDurableCache, writeMemoryCache, logConsensusEvent } from "./cache.ts";
import { getSeededConsensus } from "./get-seeded.ts";
import type { PackageReviewConsensus } from "./types.ts";
import { videoHash } from "./videos.ts";

export function emptyConsensus(packageId: string): PackageReviewConsensus {
  return {
    packageId,
    overallSentiment: "mixed",
    keyPositives: [],
    keyNegatives: [],
    caveats: [],
    consensusSummary: "",
    sources: [],
    updatedAt: new Date().toISOString(),
    origin: "empty",
  };
}

/**
 * Read-only reviewer notes: the saved `reviewer_consensus` row for this
 * stay's curated videos, else the curated seed in `seed.ts`, else empty.
 * Nothing here calls YouTube or a model.
 */
export async function loadConsensus(packageId: string): Promise<PackageReviewConsensus> {
  const hash = videoHash(packageId);
  const cached = await readDurableCache(packageId, hash);
  if (cached) {
    const consensus = attachRoomNotes(packageId, cached);
    logConsensusEvent("hit", packageId, { origin: consensus.origin });
    return consensus;
  }
  const seed = getSeededConsensus(packageId);
  if (seed) {
    writeMemoryCache(seed, hash);
    logConsensusEvent("seed", packageId);
    return seed;
  }
  logConsensusEvent("empty", packageId);
  return emptyConsensus(packageId);
}

/** Saved rows rarely mention rooms — keep curated room notes on the payload. */
function attachRoomNotes(
  packageId: string,
  consensus: PackageReviewConsensus,
): PackageReviewConsensus {
  if (consensus.roomNotes && Object.keys(consensus.roomNotes).length > 0) {
    return consensus;
  }
  const seed = getSeededConsensus(packageId);
  if (!seed?.roomNotes) return consensus;
  return { ...consensus, roomNotes: seed.roomNotes };
}
