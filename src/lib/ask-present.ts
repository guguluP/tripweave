import { SOURCES } from "./arrival-rules.ts";

export type AskChip = { title: string; url: string };

export type PresentedAnswer = {
  prose: string;
  chips: AskChip[];
  /** True when the reply is a TripWeave stay fact and cites no official URL. */
  tripweave: boolean;
};

/** Every official source Ask may cite. Answers come only from arrival-ask.ts, never a model. */
export const OFFICIAL_URLS: string[] = Object.values(SOURCES).map((source) => source.url);

const TITLES = new Map<string, string>(Object.values(SOURCES).map((source) => [source.url, source.title]));

/** Pull official links out of a grounded reply so the sentence and the chips are separate. */
export function presentAnswer(answer: string, allowed: string[]): PresentedAnswer {
  const found = answer.match(/https?:\/\/[^\s)]+/g) ?? [];
  const chips: AskChip[] = [];
  for (const raw of found) {
    // Longest matching source wins, so ".../evisa/tvoa.html" is not filed under ".../evisa/".
    const url = allowed
      .filter((item) => raw.startsWith(item))
      .sort((a, b) => b.length - a.length)[0];
    if (!url || chips.some((chip) => chip.url === url)) continue;
    chips.push({ title: TITLES.get(url) ?? "Official source", url });
  }
  let prose = answer;
  // Cut longer links first: cutting ".../evisa/" first would leave "tvoa.html" in the sentence.
  const cut = [...new Set(found)].sort((a, b) => b.length - a.length);
  for (const raw of cut) prose = prose.split(raw).join(" ");
  prose = prose
    .split("\n")
    .map((line) =>
      line
        // "(<url>)" leaves "( )" behind once the link becomes a chip.
        .replace(/\(\s*\)/g, " ")
        // "...checked; see <url>" must not end in a dangling "see".
        .replace(/[;,]?\s*\bsee\s*[.;,]?\s*$/i, ".")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+([.,;:])/g, "$1")
        .replace(/\.{2,}$/, ".")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
  const tripweave = prose.includes("TripWeave") && chips.length === 0;
  return { prose: prose || answer.trim(), chips, tripweave };
}

/** Ten asks in a rolling hour. `kept` is the timestamps that still count. */
export function takeQuota(
  timestamps: number[],
  now: number,
  limit = 10,
  windowMs = 60 * 60_000,
): { ok: boolean; kept: number[] } {
  const kept = timestamps.filter((at) => now - at < windowMs);
  if (kept.length >= limit) return { ok: false, kept };
  kept.push(now);
  return { ok: true, kept };
}
