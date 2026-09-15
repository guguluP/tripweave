export type Sentiment = "positive" | "mixed" | "negative";

export type TranscriptSegment = {
  text: string;
  start: number;
  duration: number;
};

export type FetchedTranscriptResult = {
  videoId: string;
  text: string;
  language: string;
  isGenerated: boolean;
  segments: TranscriptSegment[];
  title?: string;
};

export type TranscriptFailureReason =
  | "no_captions"
  | "private"
  | "unavailable"
  | "rate_limit"
  | "blocked"
  | "invalid"
  | "unknown";

export type TranscriptFetchError = {
  videoId: string;
  reason: TranscriptFailureReason;
  message: string;
};

export type CuratedVideo = {
  videoId: string;
  title: string;
  channel: string;
};

export type VideoSummary = {
  videoId: string;
  overallSentiment: Sentiment;
  positives: string[];
  negatives: string[];
  caveats: string[];
  summary: string;
};

export type ConsensusSource = {
  videoId: string;
  title?: string;
  url: string;
  language: string;
  isGenerated?: boolean;
};

export type PackageReviewConsensus = {
  packageId: string;
  overallSentiment: Sentiment;
  keyPositives: string[];
  keyNegatives: string[];
  caveats: string[];
  consensusSummary: string;
  sources: ConsensusSource[];
  updatedAt: string;
  /** How this payload was produced. Seed is the demo/offline path. */
  origin: "seed" | "live" | "empty";
  /** Videos we tried but could not transcribe (live runs only). */
  failedSources?: TranscriptFetchError[];
};

export type ConsensusResponse =
  | { ok: true; consensus: PackageReviewConsensus }
  | { ok: false; message: string; consensus?: PackageReviewConsensus };

export const LANGUAGE_PRIORITY = ["or", "hi", "en", "bn", "ta", "te"] as const;

export function youtubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
