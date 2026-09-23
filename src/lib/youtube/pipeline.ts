import { getPackage } from "@/lib/packages";
import { aggregateSummaries, emptyConsensus } from "./aggregate.ts";
import { readDurableCache, writeDurableCache, writeMemoryCache, logConsensusEvent } from "./cache.ts";
import { getSeededConsensus } from "./get-seeded.ts";
import {
  isXaiConfigured,
  summarizeConsensusNarrative,
  summarizeTranscript,
} from "./summarize.ts";
import { captionFailureCopy } from "./caption-copy.ts";
import { fetchTranscriptsSequential } from "./transcript.ts";
import type { ConsensusSource, PackageReviewConsensus } from "./types.ts";
import { youtubeUrl } from "./types.ts";
import { hashVideos, resolveVideos } from "./discover.ts";

const STALE_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 30 * 60 * 1000;
const cool = globalThis as typeof globalThis & { __twConsensusCool__?: Map<string, number> };
if (!cool.__twConsensusCool__) cool.__twConsensusCool__ = new Map();

/** Live rebuilds rarely mention rooms — keep curated room notes on the payload. */
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

async function storedConsensus(packageId: string, hash: string) {
  const cached = await readDurableCache(packageId, hash);
  if (cached) return attachRoomNotes(packageId, cached);
  const seed = getSeededConsensus(packageId);
  if (seed) return attachRoomNotes(packageId, seed);
  return null;
}

/** Page load reads the saved consensus. Rebuild is the explicit button. */
export async function loadConsensus(packageId: string): Promise<PackageReviewConsensus> {
  const videos = await resolveVideos(packageId);
  const hash = hashVideos(packageId, videos);
  const cached = await readDurableCache(packageId, hash);
  if (cached) {
    const consensus = attachRoomNotes(packageId, cached);
    logConsensusEvent("hit", packageId, { origin: consensus.origin });
    return consensus;
  }
  const seed = getSeededConsensus(packageId);
  if (seed) {
    writeMemoryCache(seed, hash);
    logConsensusEvent("seed", packageId, { videos: videos.length });
    return seed;
  }
  logConsensusEvent("empty", packageId);
  return emptyConsensus(packageId);
}

/**
 * Live rebuild. Sequential YouTube fetches, one LLM call per usable
 * transcript, one optional aggregator call. Search fills extra videos
 * when YOUTUBE_API_KEY is set. Falls back to the previous notes if
 * captions or the model are unavailable.
 */
export async function rebuildConsensus(packageId: string): Promise<PackageReviewConsensus> {
  const pkg = getPackage(packageId);
  const videos = await resolveVideos(packageId);
  const hash = hashVideos(packageId, videos);
  const fallback = (await storedConsensus(packageId, hash)) ?? emptyConsensus(packageId);

  if (videos.length === 0) {
    const empty = attachRoomNotes(packageId, emptyConsensus(packageId));
    await writeDurableCache(empty, hash);
    return empty;
  }

  const { ok, failed } = await fetchTranscriptsSequential(videos.map((v) => v.videoId));
  logConsensusEvent("live", packageId, {
    transcripts: `${ok.length}/${videos.length}`,
    failed: failed.map((f) => f.reason),
    llm: isXaiConfigured(),
  });

  if (ok.length === 0) {
    logConsensusEvent("fail", packageId, { reason: "no_transcripts", failed: failed.map((f) => f.reason) });
    return attachRoomNotes(packageId, {
      ...fallback,
      failedSources: failed,
      rebuildNote: captionFailureCopy(failed) ?? undefined,
    });
  }

  const hotelName = pkg?.name ?? packageId;
  const summaries = [];
  const sources: ConsensusSource[] = [];

  for (const t of ok) {
    const curated = videos.find((v) => v.videoId === t.videoId);
    sources.push({
      videoId: t.videoId,
      title: t.title ?? curated?.title,
      url: youtubeUrl(t.videoId),
      language: t.language,
      isGenerated: t.isGenerated,
    });
    if (!isXaiConfigured()) continue;
    try {
      const summary = await summarizeTranscript(t, hotelName);
      if (summary) summaries.push(summary);
    } catch (err) {
      console.warn("[reviewer-consensus] summarize failed", t.videoId, err);
    }
  }

  if (summaries.length === 0) {
    logConsensusEvent("fail", packageId, { reason: "no_summaries" });
    return attachRoomNotes(packageId, {
      ...fallback,
      failedSources: failed,
      sources,
      rebuildNote: captionFailureCopy(failed) ?? "Could not turn captions into notes.",
    });
  }

  let consensus = aggregateSummaries(packageId, summaries, sources, failed, "live");
  if (isXaiConfigured() && summaries.length > 1) {
    const narrative = await summarizeConsensusNarrative(
      hotelName,
      {
        positives: consensus.keyPositives,
        negatives: consensus.keyNegatives,
        caveats: consensus.caveats,
      },
      summaries.map((s) => s.summary),
    );
    if (narrative) consensus = { ...consensus, consensusSummary: narrative };
  }

  consensus = attachRoomNotes(packageId, consensus);
  await writeDurableCache(consensus, hash);
  logConsensusEvent("live", packageId, { origin: "written", sentiment: consensus.overallSentiment });
  return consensus;
}
