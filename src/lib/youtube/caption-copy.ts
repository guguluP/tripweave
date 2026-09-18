import type { TranscriptFailureReason, TranscriptFetchError } from "./types.ts";

export function isCaptionHostBlock(reason: TranscriptFailureReason) {
  return reason === "blocked" || reason === "rate_limit";
}

/** Copy for the stay page after a rebuild. Distinguishes IP blocks from missing captions. */
export function captionFailureCopy(failed: TranscriptFetchError[]): string | null {
  if (failed.length === 0) return null;
  const blocked = failed.filter((f) => isCaptionHostBlock(f.reason)).length;
  const none = failed.filter((f) => f.reason === "no_captions").length;
  const other = failed.length - blocked - none;
  if (blocked === failed.length) {
    return "YouTube blocked caption download from this server. The reviews still have captions — we could not pull the text. Curated notes from those videos stay on the page.";
  }
  if (none === failed.length) {
    return failed.length === 1 ? "1 video had no usable captions." : `${failed.length} videos had no usable captions.`;
  }
  const bits: string[] = [];
  if (blocked) bits.push(`${blocked} blocked by YouTube`);
  if (none) bits.push(`${none} with no captions`);
  if (other) bits.push(`${other} failed to fetch`);
  return `${bits.join(", ")}. Curated notes from those reviews stay on the page.`;
}
