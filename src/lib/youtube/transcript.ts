import {
  LANGUAGE_PRIORITY,
  type FetchedTranscriptResult,
  type TranscriptFailureReason,
  type TranscriptFetchError,
  type TranscriptSegment,
} from "./types.ts";

const CLEAN_NOISE = /^\s*\[(music|applause|laughter|cheers|silence)\]\s*$/i;

function classifyError(videoId: string, err: unknown): TranscriptFetchError {
  const name = err instanceof Error ? err.constructor.name : "";
  const message = err instanceof Error ? err.message : String(err);
  let reason: TranscriptFailureReason = "unknown";
  const blob = `${name} ${message}`.toLowerCase();
  if (blob.includes("ratelimit") || blob.includes("rate limit")) reason = "rate_limit";
  else if (blob.includes("ipblocked") || blob.includes("requestblocked") || blob.includes("blocked"))
    reason = "blocked";
  else if (blob.includes("disabled") || blob.includes("notranscript") || blob.includes("not found"))
    reason = "no_captions";
  else if (blob.includes("unavailable") || blob.includes("private") || blob.includes("unplayable"))
    reason = "unavailable";
  else if (blob.includes("invalidvideoid") || blob.includes("invalid video")) reason = "invalid";
  else if (blob.includes("agerestricted")) reason = "unavailable";
  return { videoId, reason, message: message.slice(0, 280) };
}

export function cleanTranscriptText(segments: TranscriptSegment[]): string {
  const parts: string[] = [];
  for (const seg of segments) {
    const text = seg.text.replace(/\s+/g, " ").trim();
    if (!text || CLEAN_NOISE.test(text)) continue;
    parts.push(text);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

type TrackLike = {
  languageCode: string;
  isGenerated: boolean;
  fetch: (preserve?: boolean) => Promise<{
    snippets: Array<{ text: string; start: number; duration: number }>;
    language: string;
    languageCode: string;
    isGenerated: boolean;
    metadata?: { title?: string };
  }>;
  translate?: (code: string) => TrackLike;
  isTranslatable?: boolean;
};

/**
 * Prefer a manually created track in LANGUAGE_PRIORITY order, then
 * auto-generated in the same order. Pure so tests can cover it.
 */
export function pickPreferredTrack<T extends { languageCode: string; isGenerated: boolean }>(
  tracks: T[],
  languages: readonly string[] = LANGUAGE_PRIORITY,
): T | null {
  if (tracks.length === 0) return null;
  const index = (code: string) => {
    const i = languages.indexOf(code.toLowerCase().split("-")[0] ?? code);
    return i === -1 ? 99 : i;
  };
  const sorted = [...tracks].sort((a, b) => {
    if (a.isGenerated !== b.isGenerated) return a.isGenerated ? 1 : -1;
    return index(a.languageCode) - index(b.languageCode);
  });
  const inPriority = sorted.filter((t) => index(t.languageCode) < 99);
  return (inPriority[0] ?? sorted[0]) ?? null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithLibrary(
  videoId: string,
  languages: readonly string[],
): Promise<FetchedTranscriptResult> {
  const { YouTubeTranscriptApi } = await import("youtube-transcript-api-js");
  const api = new YouTubeTranscriptApi();
  const list = await api.list(videoId);
  const tracks = list.getAllTranscripts() as unknown as TrackLike[];
  const picked = pickPreferredTrack(tracks, languages);
  if (!picked) {
    throw new Error("NoTranscriptFound: no caption tracks");
  }
  let track = picked;
  // Translate into English when the engine allows it, so the LLM reads one language.
  if (
    track.languageCode.toLowerCase().split("-")[0] !== "en" &&
    track.isTranslatable &&
    typeof track.translate === "function"
  ) {
    try {
      track = track.translate("en");
    } catch {
      /* keep original language */
    }
  }
  const fetched = await track.fetch(false);
  const segments: TranscriptSegment[] = fetched.snippets.map((s) => ({
    text: s.text,
    start: s.start,
    duration: s.duration,
  }));
  return {
    videoId,
    text: cleanTranscriptText(segments),
    language: fetched.languageCode,
    isGenerated: fetched.isGenerated,
    segments,
    title: fetched.metadata?.title,
  };
}

/**
 * Fetch a transcript with Odia → Hindi → English language priority.
 * Prefers manual captions. Throws a classified error for the pipeline.
 */
export async function fetchTranscript(
  videoId: string,
  languages: readonly string[] = LANGUAGE_PRIORITY,
): Promise<FetchedTranscriptResult> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw Object.assign(new Error("Invalid video id"), { reason: "invalid" });
  }
  try {
    const result = await fetchWithLibrary(videoId, languages);
    if (!result.text) {
      const err = new Error("Empty transcript");
      throw err;
    }
    return result;
  } catch (err) {
    const classified = classifyError(videoId, err);
    const wrapped = new Error(classified.message);
    (wrapped as Error & { classified: TranscriptFetchError }).classified = classified;
    throw wrapped;
  }
}

export function readClassified(err: unknown, videoId: string): TranscriptFetchError {
  if (err && typeof err === "object" && "classified" in err) {
    return (err as { classified: TranscriptFetchError }).classified;
  }
  return classifyError(videoId, err);
}

/** Sequential fetch so we do not hammer YouTube. */
export async function fetchTranscriptsSequential(
  videoIds: string[],
  gapMs = 450,
): Promise<{
  ok: FetchedTranscriptResult[];
  failed: TranscriptFetchError[];
}> {
  const ok: FetchedTranscriptResult[] = [];
  const failed: TranscriptFetchError[] = [];
  for (let i = 0; i < videoIds.length; i++) {
    const id = videoIds[i]!;
    try {
      ok.push(await fetchTranscript(id));
    } catch (err) {
      failed.push(readClassified(err, id));
    }
    if (i < videoIds.length - 1) await sleep(gapMs);
  }
  return { ok, failed };
}
