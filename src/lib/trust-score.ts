/**
 * TripWeave Trust Score (0-100)
 *
 * Transparent composite - not a star average and not a booking-site review count.
 *
 * Breakdown (disclosed in UI):
 *  - 50 pts - YouTube consensus (positive / mixed / negative from curated stay reviews)
 *  - 25 pts - Review depth (curated video count, capped) + honesty bonus when
 *             caveats / watch-outs exist
 *  - 20 pts - Property completeness (photos, rooms, property tours, nights flexibility)
 *  -  5 pts - TripWeave guest notes (avg rating from finished stays). Weight is 0
 *             until guestRating exists on the catalog overlay.
 *
 * Hotel-upload penalty: when curated YouTube sources look like property-owned
 * walkthroughs (channel ~ hotel / official, etc.), consensus is capped so a
 * stack of promo reels cannot read as independent guest consensus.
 *
 * UI always shows X/100 with an explainer and N YouTube sources.
 */
import type { StayPackage } from "./packages.ts";
import { overlayFor } from "./catalog-store.ts";
import type { CuratedVideo, PackageReviewConsensus, Sentiment } from "./youtube/types.ts";
import { getSeededConsensus } from "./youtube/get-seeded.ts";
import { PACKAGE_VIDEOS } from "./youtube/videos.ts";

export const TRUST_SCORE_MAX = 100;
export const TRUST_CONSENSUS_MAX = 50;
export const TRUST_DEPTH_MAX = 25;
export const TRUST_COMPLETENESS_MAX = 20;
export const TRUST_GUEST_MAX = 5;
export const TRUST_HOTEL_UPLOAD_PENALTY_MAX = 14;

export const TRUST_SCORE_EXPLAINER =
  "Consensus, depth, completeness, and TripWeave guest notes - not a star average.";

export type TrustScoreBreakdown = {
  total: number;
  consensus: number;
  depth: number;
  completeness: number;
  guestNotes: number;
  hotelUploadPenalty: number;
  youtubeSources: number;
  sentiment: Sentiment | null;
  hotelUploadRatio: number;
  honestyBonus: boolean;
};

export type TrustGuestInput = {
  guestRating?: number | null;
  guestCount?: number | null;
};

const CONSENSUS_POINTS: Record<Sentiment, number> = {
  positive: 50,
  mixed: 28,
  negative: 10,
};

const CONSENSUS_UNKNOWN = 16;

export function looksLikeHotelUpload(
  video: Pick<CuratedVideo, "channel" | "title">,
  propertyName: string,
): boolean {
  const channel = video.channel.toLowerCase().trim();
  const title = video.title.toLowerCase().trim();
  const brandTokens = propertyName
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !["puri", "resort", "hotel", "beach", "spa", "central"].includes(t));

  const channelHasOfficial = /\bofficial\b/.test(channel);
  const titleHasOfficial = /\bofficial\b/.test(title);
  const channelHasLodging = /\b(hotel|resort|palace|inn|suites?)\b/.test(channel);
  const brandInChannel = brandTokens.some((t) => channel.includes(t));
  const brandInTitle = brandTokens.some((t) => title.includes(t));

  if (channelHasOfficial) return true;
  if (brandInChannel && channelHasLodging) return true;
  if (titleHasOfficial && (brandInChannel || brandInTitle || channelHasLodging)) return true;
  if (brandInChannel && brandTokens.length >= 1 && channel.split(/\s+/).length <= 4) {
    if (/\b(hotels?|resorts?|group|hospitality)\b/.test(channel)) return true;
  }
  return false;
}

export function hotelUploadStats(
  packageId: string,
  propertyName: string,
): { ratio: number; total: number; hotelLike: number } {
  const videos = PACKAGE_VIDEOS[packageId] ?? [];
  if (videos.length === 0) return { ratio: 0, total: 0, hotelLike: 0 };
  const hotelLike = videos.filter((v) => looksLikeHotelUpload(v, propertyName)).length;
  return { ratio: hotelLike / videos.length, total: videos.length, hotelLike };
}

function reviewDepthPoints(
  videoCount: number,
  consensus: PackageReviewConsensus | null,
): { points: number; honestyBonus: boolean } {
  const cappedVideos = Math.min(Math.max(videoCount, 0), 5);
  const fromCount = [0, 5, 9, 12, 15, 18][cappedVideos] ?? 18;
  let honesty = 0;
  let honestyBonus = false;
  if (consensus) {
    const roomWatchouts = Object.values(consensus.roomNotes ?? {}).some(
      (n) => (n.watchouts?.length ?? 0) > 0,
    );
    const hasCaveats =
      (consensus.caveats?.length ?? 0) > 0 ||
      (consensus.keyNegatives?.length ?? 0) > 0 ||
      roomWatchouts;
    if (hasCaveats) {
      honesty = 7;
      honestyBonus = true;
    }
  }
  return {
    points: Math.min(TRUST_DEPTH_MAX, fromCount + honesty),
    honestyBonus,
  };
}

function completenessPoints(pkg: Pick<
  StayPackage,
  "images" | "rooms" | "videos" | "nightsMin" | "nightsMax"
>): number {
  const photos = Math.min(pkg.images.filter(Boolean).length, 6);
  const rooms = Math.min(pkg.rooms.length, 3) * 2;
  const tours = pkg.videos.length > 0 ? 4 : 0;
  const span = Math.max(0, pkg.nightsMax - pkg.nightsMin);
  const nightsFlex = span >= 4 ? 4 : span >= 1 ? 2 : 0;
  return Math.min(TRUST_COMPLETENESS_MAX, photos + rooms + tours + nightsFlex);
}

export function guestNotesPoints(input?: TrustGuestInput | null): number {
  const rating = input?.guestRating;
  const count = input?.guestCount ?? 0;
  if (rating == null || !Number.isFinite(rating) || count < 1) return 0;
  const clamped = Math.min(5, Math.max(1, rating));
  return Math.round((clamped / 5) * TRUST_GUEST_MAX);
}

export function consensusPoints(sentiment: Sentiment | null | undefined): number {
  if (!sentiment) return CONSENSUS_UNKNOWN;
  return CONSENSUS_POINTS[sentiment];
}

function resolveGuestInput(
  packageId: string,
  guest?: TrustGuestInput | null,
): TrustGuestInput {
  if (guest !== undefined && guest !== null) return guest;
  const overlay = overlayFor(packageId);
  return {
    guestRating: overlay?.guestRating ?? null,
    guestCount: overlay?.guestCount ?? 0,
  };
}

export function computeTrustScore(
  pkg: Pick<
    StayPackage,
    "id" | "name" | "images" | "rooms" | "videos" | "nightsMin" | "nightsMax"
  >,
  consensus?: PackageReviewConsensus | null,
  guest?: TrustGuestInput | null,
): TrustScoreBreakdown {
  const resolved = consensus === undefined ? getSeededConsensus(pkg.id) : consensus;
  const youtubeSources = pkg.videos.length;
  const sentiment = resolved?.overallSentiment ?? null;
  let consensusPts = consensusPoints(sentiment);

  const upload = hotelUploadStats(pkg.id, pkg.name);
  let hotelUploadPenalty = 0;
  if (upload.total > 0 && upload.ratio >= 0.8) {
    hotelUploadPenalty = Math.min(
      TRUST_HOTEL_UPLOAD_PENALTY_MAX,
      Math.round(consensusPts * 0.35 + 4),
    );
    consensusPts = Math.max(0, consensusPts - hotelUploadPenalty);
  }

  const depthResult = reviewDepthPoints(youtubeSources, resolved);
  const completeness = completenessPoints(pkg);
  const guestNotes = guestNotesPoints(resolveGuestInput(pkg.id, guest));
  const total = Math.min(
    TRUST_SCORE_MAX,
    Math.max(
      0,
      Math.round(consensusPts + depthResult.points + completeness + guestNotes),
    ),
  );

  return {
    total,
    consensus: consensusPts,
    depth: depthResult.points,
    completeness,
    guestNotes,
    hotelUploadPenalty,
    youtubeSources,
    sentiment,
    hotelUploadRatio: upload.ratio,
    honestyBonus: depthResult.honestyBonus,
  };
}

export function trustScoreForPackage(
  pkg: Pick<
    StayPackage,
    "id" | "name" | "images" | "rooms" | "videos" | "nightsMin" | "nightsMax"
  >,
  guest?: TrustGuestInput | null,
): number {
  return computeTrustScore(pkg, undefined, guest).total;
}

export function youtubeSourceCount(pkg: Pick<StayPackage, "videos">): number {
  return pkg.videos.length;
}

export function formatTrustScore(score: number): string {
  const n = Math.min(TRUST_SCORE_MAX, Math.max(0, Math.round(score)));
  return `${n}/100`;
}

export function youtubeSourcesLabel(count: number): string {
  if (count === 1) return "1 YouTube source";
  return `${count} YouTube sources`;
}

export function formatTrustBreakdown(
  b: Pick<TrustScoreBreakdown, "consensus" | "depth" | "completeness" | "guestNotes">,
): string {
  const base = `${b.consensus} - ${b.depth} - ${b.completeness}`;
  if (b.guestNotes > 0) return `${base} - +${b.guestNotes} guests`;
  return base;
}

export const TRUST_BREAKDOWN_HINT = "Consensus - depth - completeness";
