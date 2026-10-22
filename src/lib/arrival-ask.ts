import { checklistForParty, SOURCES } from "./arrival-rules.ts";

const FALLBACK_START = "Not stated by the official sources TripWeave checked; see ";

export type AskGrounding = {
  nationalities: string[];
  oci?: boolean[];
  priorIndianVisa?: boolean[];
  arrivalAirport?: string;
  checkIn?: string;
};

/** Checklist sentences and their official URLs. Nothing else is sent to the model. */
export function groundingPacket(input: AskGrounding): { text: string; urls: string[] } {
  const items = checklistForParty({
    nationalities: input.nationalities,
    oci: input.oci,
    priorIndianVisa: input.priorIndianVisa,
    arrivalAirport: input.arrivalAirport ?? "BBI",
    arrivalDate: input.checkIn,
  });
  const urls: string[] = [];
  const lines = items.map((row) => {
    const source = SOURCES[row.sourceId];
    if (!urls.includes(source.url)) urls.push(source.url);
    return `- ${row.text} (${source.url})`;
  });
  if (urls.length === 0) urls.push("https://indianvisaonline.gov.in/evisa/");
  lines.push("Stay: a hotel in Puri, Odisha. The street address is not on file.");
  lines.push("Rules checked 19 Oct 2026.");
  return { text: lines.join("\n"), urls };
}

export function fallbackAnswer(urls: string[]): string {
  return `${FALLBACK_START}${urls[0] ?? "https://indianvisaonline.gov.in/evisa/"}`;
}

/** Keep a model reply only when it cites one of the packet URLs and no other site. */
export function acceptGroundedReply(reply: string, urls: string[]): string {
  const text = reply.replace(/\s+/g, " ").trim().slice(0, 1200);
  if (!text) return fallbackAnswer(urls);
  const cited = urls.some((url) => text.includes(url));
  if (!cited) return fallbackAnswer(urls);
  const found = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  const foreign = found.some((url) => !urls.some((allowed) => url.startsWith(allowed)));
  if (foreign) return fallbackAnswer(urls);
  return text;
}
