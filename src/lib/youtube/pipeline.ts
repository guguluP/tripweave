import { getPackage } from "@/lib/packages";
import { aggregateSummaries, emptyConsensus } from "./aggregate.ts";
import { readDurableCache, writeDurableCache, writeMemoryCache, logConsensusEvent } from "./cache.ts";
import { getSeededConsensus } from "./seed.ts";
import {
  isXaiConfigured,
  summarizeConsensusNarrative,
  summarizeTranscript,
} from "./summarize.ts";
import { fetchTranscriptsSequential } from "./transcript.ts";
import type { ConsensusSource, PackageReviewConsensus } from "./types.ts";
import { youtubeUrl } from "./types.ts";
import { videoHash, videosForPackage } from "./videos.ts";

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

/**
 * Read path — never calls YouTube or the LLM.
 * Memory → Supabase → curated seed. Works fully offline/demo.
 */
export async function loadConsensus(packageId: string): Promise<PackageReviewConsensus> {
  const videos = videosForPackage(packageId);
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
    logConsensusEvent("seed", packageId, { videos: videos.length });
    return seed;
  }
  logConsensusEvent("empty", packageId);
  return emptyConsensus(packageId);
}

/**
 * Live rebuild. User-initiated only. Sequential YouTube fetches,
 * one LLM call per usable transcript, one optional aggregator call.
 * Falls back to the previous seed/cache if nothing usable comes back.
 */
export async function rebuildConsensus(packageId: string): Promise<PackageReviewConsensus> {
  const pkg = getPackage(packageId);
  const videos = videosForPackage(packageId);
  const hash = videoHash(packageId);
  const fallback = await loadConsensus(packageId);

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
    logConsensusEvent("fail", packageId, { reason: "no_transcripts" });
    return attachRoomNotes(packageId, { ...fallback, failedSources: failed });
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
    return attachRoomNotes(packageId, { ...fallback, failedSources: failed, sources });
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
