import {
  LANGUAGE_PRIORITY,
  type FetchedTranscriptResult,
  type TranscriptFailureReason,
  type TranscriptFetchError,
  type TranscriptSegment,
} from "./types.ts";

const CLEAN_NOISE = /^\s*\[(music|applause|laughter|cheers|silence)\]\s*$/i;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function classifyError(videoId: string, err: unknown): TranscriptFetchError {
  const name = err instanceof Error ? err.constructor.name : "";
  const message = err instanceof Error ? err.message : String(err);
  let reason: TranscriptFailureReason = "unknown";
  const blob = `${name} ${message}`.toLowerCase();
  if (blob.includes("ratelimit") || blob.includes("rate limit") || blob.includes("too many requests"))
    reason = "rate_limit";
  else if (
    blob.includes("ipblocked") ||
    blob.includes("requestblocked") ||
    blob.includes("blocked") ||
    blob.includes("login_required") ||
    blob.includes("not a bot") ||
    blob.includes("unusual traffic") ||
    blob.includes("captcha")
  )
    reason = "blocked";
  else if (blob.includes("disabled") || blob.includes("notranscript") || blob.includes("not found") || blob.includes("no caption"))
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

function decodeEntities(text: string) {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseJson3(raw: string): TranscriptSegment[] {
  const parsed = JSON.parse(raw) as {
    events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }>;
  };
  const segments: TranscriptSegment[] = [];
  for (const event of parsed.events ?? []) {
    const text = (event.segs ?? [])
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    segments.push({
      text: decodeEntities(text),
      start: (event.tStartMs ?? 0) / 1000,
      duration: (event.dDurationMs ?? 0) / 1000,
    });
  }
  return segments;
}

function parseTimedTextXml(raw: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const re = /<text([^>]*)>([\s\S]*?)<\/text>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const attrs = m[1] ?? "";
    const start = Number(/start="([^"]+)"/.exec(attrs)?.[1] ?? 0);
    const duration = Number(/(?:dur|d)="([^"]+)"/.exec(attrs)?.[1] ?? 0);
    const text = decodeEntities((m[2] ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (text) segments.push({ text, start, duration });
  }
  return segments;
}

function segmentsFromCaptionBody(raw: string): TranscriptSegment[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{")) {
    try {
      return parseJson3(trimmed);
    } catch {
      /* fall through */
    }
  }
  return parseTimedTextXml(trimmed);
}

type CaptionTrack = {
  languageCode: string;
  isGenerated: boolean;
  baseUrl: string;
};

async function fetchPlayerTracks(videoId: string): Promise<{ tracks: CaptionTrack[]; title?: string }> {
  const clients = [
    {
      url: "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      ua: UA,
      body: {
        context: { client: { clientName: "WEB", clientVersion: "2.20240101.00.00", hl: "en", gl: "IN" } },
        videoId,
      },
    },
    {
      url: "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      ua: "com.google.android.youtube/19.28.35 (Linux; U; Android 13) gzip",
      body: {
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "19.28.35",
            androidSdkVersion: 33,
            hl: "en",
            gl: "IN",
          },
        },
        videoId,
        contentCheckOk: true,
        racyCheckOk: true,
      },
    },
  ];

  let lastError = "No caption tracks";
  for (const client of clients) {
    const res = await fetch(client.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": client.ua,
        Origin: "https://www.youtube.com",
      },
      body: JSON.stringify(client.body),
      signal: AbortSignal.timeout(10_000),
    });
    const raw = await res.text();
    if (!res.ok) {
      lastError = `player ${res.status}`;
      continue;
    }
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      lastError = "player not json";
      continue;
    }
    const status = (json.playabilityStatus as { status?: string; reason?: string } | undefined)?.status;
    const reason = (json.playabilityStatus as { reason?: string } | undefined)?.reason ?? "";
    if (status && status !== "OK") {
      lastError = `${status} ${reason}`.trim();
      if (/login_required|bot/i.test(`${status} ${reason}`)) {
        throw new Error(`LOGIN_REQUIRED: ${reason || status}`);
      }
      continue;
    }
    const captions = json.captions as
      | { playerCaptionsTracklistRenderer?: { captionTracks?: Array<Record<string, unknown>> } }
      | undefined;
    const rawTracks = captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    const tracks: CaptionTrack[] = rawTracks
      .map((t) => ({
        languageCode: String(t.languageCode ?? "und"),
        isGenerated: String(t.kind ?? "") === "asr",
        baseUrl: String(t.baseUrl ?? ""),
      }))
      .filter((t) => t.baseUrl);
    if (tracks.length === 0) {
      lastError = "NoTranscriptFound: no caption tracks";
      continue;
    }
    const title = (json.videoDetails as { title?: string } | undefined)?.title;
    return { tracks, title };
  }
  throw new Error(lastError);
}

async function fetchCaptionFile(baseUrl: string): Promise<TranscriptSegment[]> {
  const url = new URL(baseUrl);
  if (!url.searchParams.has("fmt")) url.searchParams.set("fmt", "json3");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": UA, Accept: "*/*" },
    signal: AbortSignal.timeout(10_000),
  });
  const raw = await res.text();
  if (!res.ok || !raw.trim()) {
    throw new Error("Empty transcript");
  }
  return segmentsFromCaptionBody(raw);
}

async function fetchWithInnertube(
  videoId: string,
  languages: readonly string[],
): Promise<FetchedTranscriptResult> {
  const { tracks, title } = await fetchPlayerTracks(videoId);
  const picked = pickPreferredTrack(tracks, languages);
  if (!picked) throw new Error("NoTranscriptFound: no caption tracks");
  const segments = await fetchCaptionFile(picked.baseUrl);
  const text = cleanTranscriptText(segments);
  if (!text) throw new Error("Empty transcript");
  return {
    videoId,
    text,
    language: picked.languageCode,
    isGenerated: picked.isGenerated,
    segments,
    title,
  };
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
  const attempts = [fetchWithInnertube, fetchWithLibrary];
  let last: unknown;
  for (const attempt of attempts) {
    try {
      const result = await attempt(videoId, languages);
      if (!result.text) throw new Error("Empty transcript");
      return result;
    } catch (err) {
      last = err;
      const classified = classifyError(videoId, err);
      if (classified.reason === "invalid" || classified.reason === "unavailable") break;
    }
  }
  const classified = classifyError(videoId, last);
  const wrapped = new Error(classified.message);
  (wrapped as Error & { classified: TranscriptFetchError }).classified = classified;
  throw wrapped;
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
  gapMs = 650,
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
