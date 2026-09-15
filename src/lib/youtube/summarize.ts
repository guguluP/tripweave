import type { FetchedTranscriptResult, VideoSummary } from "./types.ts";

const MODEL = "grok-4.5";
const MAX_TRANSCRIPT_CHARS = 12_000;
const MAX_TOKENS = 700;

const SYSTEM = `You extract hotel stay feedback from YouTube review transcripts.
Ignore intros, outros, subscribe-asks, music, ads, and sightseeing that is not about the hotel.
Only report what the reviewer actually said about the stay: rooms, food, staff, cleanliness, beach, pool, value, noise, booking issues.
Reply with a single JSON object, no markdown:
{
  "overall_sentiment": "positive" | "mixed" | "negative",
  "positives": string[],
  "negatives": string[],
  "caveats": string[],
  "summary": string
}
Keep bullets short (under 14 words). Summary: 2 sentences, plain English.
If the transcript is not a hotel review, still fill the shape with empty arrays and a one-line summary saying so.`;

function clip(text: string) {
  if (text.length <= MAX_TRANSCRIPT_CHARS) return text;
  return `${text.slice(0, MAX_TRANSCRIPT_CHARS)}…`;
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function asSentiment(value: unknown): VideoSummary["overallSentiment"] {
  return value === "positive" || value === "negative" || value === "mixed" ? value : "mixed";
}

export function parseVideoSummary(videoId: string, raw: string): VideoSummary | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
  if (!summary) return null;
  return {
    videoId,
    overallSentiment: asSentiment(obj.overall_sentiment),
    positives: asStringArray(obj.positives),
    negatives: asStringArray(obj.negatives),
    caveats: asStringArray(obj.caveats),
    summary,
  };
}

export function isXaiConfigured() {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

async function chatJson(user: string): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return null;
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    console.warn(`[reviewer-consensus] xAI ${res.status}`);
    return null;
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return body.choices?.[0]?.message?.content ?? null;
}

export async function summarizeTranscript(
  transcript: FetchedTranscriptResult,
  hotelName: string,
): Promise<VideoSummary | null> {
  const prompt = `Hotel: ${hotelName}
Video id: ${transcript.videoId}
Caption language: ${transcript.language} (${transcript.isGenerated ? "auto" : "manual"})

Transcript:
${clip(transcript.text)}`;
  const raw = await chatJson(prompt);
  if (!raw) return null;
  return parseVideoSummary(transcript.videoId, raw);
}

export async function summarizeConsensusNarrative(
  hotelName: string,
  bullets: { positives: string[]; negatives: string[]; caveats: string[] },
  perVideo: string[],
): Promise<string | null> {
  const prompt = `Write one 2-sentence consensus for "${hotelName}" from these reviewer notes.
Positives: ${JSON.stringify(bullets.positives)}
Negatives: ${JSON.stringify(bullets.negatives)}
Caveats: ${JSON.stringify(bullets.caveats)}
Per-video summaries: ${JSON.stringify(perVideo)}
Return JSON {"overall_sentiment":"...","positives":[],"negatives":[],"caveats":[],"summary":"..."} using the same positives/negatives/caveats.`;
  const raw = await chatJson(prompt);
  if (!raw) return null;
  const parsed = parseJsonObject(raw);
  const summary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";
  return summary || null;
}
