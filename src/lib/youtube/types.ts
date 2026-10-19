export type Sentiment = "positive" | "mixed" | "negative";

export type CuratedVideo = {
  videoId: string;
  title: string;
  channel: string;
};

export type ConsensusSource = {
  videoId: string;
  title?: string;
  url: string;
  language: string;
  isGenerated?: boolean;
};

export type RoomReviewNotes = {
  summary: string;
  positives: string[];
  watchouts: string[];
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
  /** Where these notes came from: a saved row ("live"), the curated seed, or nothing. */
  origin: "seed" | "live" | "empty";
  /** Reviewer notes keyed by room id on the stay. */
  roomNotes?: Record<string, RoomReviewNotes>;
};

export type ConsensusResponse =
  | { ok: true; consensus: PackageReviewConsensus }
  | { ok: false; message: string; consensus?: PackageReviewConsensus };

export function youtubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeThumb(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
