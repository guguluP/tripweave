/**
 * TripWeave Trust Score (0–100)
 *
 * Transparent composite — not a star average and not a booking-site review count.
 *
 * Breakdown:
 *  - 55 pts — YouTube consensus (positive / mixed / negative from curated stay reviews)
 *  - 25 pts — Review depth (curated video count, capped) + honesty bonus when
 *             caveats / watch-outs exist
 *  - 20 pts — Property completeness (photos, rooms, property tours, nights flexibility)
 *
 * UI always shows "X/100" with an explainer and "N YouTube sources".
 */
import type { StayPackage } from "./packages.ts";
import type { PackageReviewConsensus, Sentiment } from "./youtube/types.ts";
import { getSeededConsensus } from "./youtube/get-seeded.ts";

export const TRUST_SCORE_MAX = 100;
export const TRUST_CONSENSUS_MAX = 55;
export const TRUST_DEPTH_MAX = 25;
export const TRUST_COMPLETENESS_MAX = 20;

/** Short product copy under the meter. */
export const TRUST_SCORE_EXPLAINER =
  "Property completeness + curated YouTube stay reviews — not a star average.";

export type TrustScoreBreakdown = {
  total: number;
  consensus: number;
  depth: number;
  completeness: number;
  youtubeSources: number;
  sentiment: Sentiment | null;
};

const CONSENSUS_POINTS: Record<Sentiment, number> = {
  positive: 55,
  mixed: 35,
  negative: 15,
};

/** Points when we have no reviewer consensus yet. */
const CONSENSUS_UNKNOWN = 22;

/**
 * Review depth: up to 20 from curated video count (cap 5), plus up to 5 honesty
 * when caveats / negatives / room watch-outs are present.
 */
function reviewDepthPoints(
  videoCount: number,
  consensus: PackageReviewConsensus | null,
): number {
  const cappedVideos = Math.min(Math.max(videoCount, 0), 5);
  const fromCount = Math.round((cappedVideos / 5) * 20);

  let honesty = 0;
  if (consensus) {
    const roomWatchouts = Object.values(consensus.roomNotes ?? {}).some(
      (n) => (n.watchouts?.length ?? 0) > 0,
    );
    const hasCaveats =
      (consensus.caveats?.length ?? 0) > 0 ||
      (consensus.keyNegatives?.length ?? 0) > 0 ||
      roomWatchouts;
    if (hasCaveats) honesty = 5;
  }

  return Math.min(TRUST_DEPTH_MAX, fromCount + honesty);
}

/**
 * Property completeness: photos, room types, property-tour videos, nights range.
 */
function completenessPoints(pkg: Pick<
  StayPackage,
  "images" | "rooms" | "videos" | "nightsMin" | "nightsMax"
>): number {
  // Photos: 1 pt each, cap 6
  const photos = Math.min(pkg.images.filter(Boolean).length, 6);
  // Room types: 2 pts each, cap 6
  const rooms = Math.min(pkg.rooms.length, 3) * 2;
  // Property tour / curated stay videos present
  const tours = pkg.videos.length > 0 ? 4 : 0;
  // Nights flexibility / media readiness of the stay window
  const span = Math.max(0, pkg.nightsMax - pkg.nightsMin);
  const nightsFlex = span >= 4 ? 4 : span >= 1 ? 2 : 0;

  return Math.min(TRUST_COMPLETENESS_MAX, photos + rooms + tours + nightsFlex);
}

export function consensusPoints(sentiment: Sentiment | null | undefined): number {
  if (!sentiment) return CONSENSUS_UNKNOWN;
  return CONSENSUS_POINTS[sentiment];
}

export function computeTrustScore(
  pkg: Pick<
    StayPackage,
    "id" | "images" | "rooms" | "videos" | "nightsMin" | "nightsMax"
  >,
  consensus?: PackageReviewConsensus | null,
): TrustScoreBreakdown {
  const resolved = consensus === undefined ? getSeededConsensus(pkg.id) : consensus;
  const youtubeSources = pkg.videos.length;
  const sentiment = resolved?.overallSentiment ?? null;
  const consensusPts = consensusPoints(sentiment);
  const depth = reviewDepthPoints(youtubeSources, resolved);
  const completeness = completenessPoints(pkg);
  const total = Math.min(
    TRUST_SCORE_MAX,
    Math.max(0, Math.round(consensusPts + depth + completeness)),
  );

  return {
    total,
    consensus: consensusPts,
    depth,
    completeness,
    youtubeSources,
    sentiment,
  };
}

/** Catalog helper: recompute the displayed 0–100 score for a stay. */
export function trustScoreForPackage(
  pkg: Pick<
    StayPackage,
    "id" | "images" | "rooms" | "videos" | "nightsMin" | "nightsMax"
  >,
): number {
  return computeTrustScore(pkg).total;
}

export function youtubeSourceCount(
  pkg: Pick<StayPackage, "videos">,
): number {
  return pkg.videos.length;
}

/** Always format as "X/100" for UI. */
export function formatTrustScore(score: number): string {
  const n = Math.min(TRUST_SCORE_MAX, Math.max(0, Math.round(score)));
  return `${n}/100`;
}

export function youtubeSourcesLabel(count: number): string {
  if (count === 1) return "1 YouTube source";
  return `${count} YouTube sources`;
}
