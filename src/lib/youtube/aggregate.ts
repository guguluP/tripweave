import type {
  ConsensusSource,
  PackageReviewConsensus,
  Sentiment,
  VideoSummary,
} from "./types.ts";

const SENTIMENT_RANK: Record<Sentiment, number> = {
  positive: 1,
  mixed: 0,
  negative: -1,
};

function normalizeBullet(s: string) {
  return s.trim().replace(/\s+/g, " ").replace(/[.]+$/, "");
}

function dedupe(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const item = normalizeBullet(raw);
    if (item.length < 3) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    // Collapse near-duplicates ("Clean rooms" vs "Very clean rooms").
    let near = false;
    for (const existing of seen) {
      if (key.includes(existing) || existing.includes(key)) {
        near = true;
        break;
      }
    }
    if (near) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function majoritySentiment(summaries: VideoSummary[]): Sentiment {
  if (summaries.length === 0) return "mixed";
  const score =
    summaries.reduce((acc, s) => acc + SENTIMENT_RANK[s.overallSentiment], 0) /
    summaries.length;
  if (score >= 0.5) return "positive";
  if (score <= -0.5) return "negative";
  return "mixed";
}

/**
 * Merge per-video structured summaries into one package consensus.
 * Deterministic — used when we have 0/1/many videos and when the
 * aggregator LLM call is skipped.
 */
export function aggregateSummaries(
  packageId: string,
  summaries: VideoSummary[],
  sources: ConsensusSource[],
  failedSources: PackageReviewConsensus["failedSources"] = [],
  origin: PackageReviewConsensus["origin"] = "live",
): PackageReviewConsensus {
  const positives = dedupe(
    summaries.flatMap((s) => s.positives),
    6,
  );
  const negatives = dedupe(
    summaries.flatMap((s) => s.negatives),
    5,
  );
  const caveats = dedupe(
    summaries.flatMap((s) => s.caveats),
    4,
  );

  let consensusSummary: string;
  if (summaries.length === 0) {
    consensusSummary = "";
  } else if (summaries.length === 1) {
    consensusSummary = summaries[0]!.summary.trim();
  } else {
    const joined = summaries
      .map((s) => s.summary.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" ");
    consensusSummary =
      joined.length > 480 ? `${joined.slice(0, 460).trim()}…` : joined;
  }

  return {
    packageId,
    overallSentiment: majoritySentiment(summaries),
    keyPositives: positives,
    keyNegatives: negatives,
    caveats,
    consensusSummary,
    sources,
    updatedAt: new Date().toISOString(),
    origin: summaries.length === 0 ? "empty" : origin,
    failedSources: failedSources?.length ? failedSources : undefined,
  };
}

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
