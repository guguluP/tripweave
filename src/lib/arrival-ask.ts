import { checklistForParty, SOURCES } from "./arrival-rules.ts";
import { isRealIsoDate } from "./check-in.ts";
import { getPackage } from "./packages.ts";
import { guestCancelMode, refundAmountInr, refundPolicyFor } from "./refund-policy.ts";
import type { ArriveBy } from "./origins.ts";
import { pickupQuoteFor } from "./travel-plan.ts";

const FALLBACK_START = "Not stated by the official sources TripWeave checked; see ";

/**
 * A document-like run: six or more digits joined only by a single space, hyphen, or dot.
 * An ISO date is not a document number.
 */
export function questionHasDocumentDigits(question: string): boolean {
  const withoutDates = question.replace(/\d{4}-\d{2}-\d{2}/g, " ");
  const runs = withoutDates.match(/\d+(?:[ .-]\d+)*/g) ?? [];
  return runs.some((run) => run.replace(/\D/g, "").length >= 6);
}

export type AskGrounding = {
  nationalities: string[];
  oci?: boolean[];
  priorIndianVisa?: boolean[];
  arrivalAirport?: string;
  checkIn?: string;
  packageId?: string;
  roomId?: string;
  nights?: number;
  arriveBy?: string;
  /** From the signed-in guest's booking row. Never a client-sent price. */
  amountInr?: number | null;
  /** From that same booking row. */
  status?: string | null;
};

function asArriveBy(value: string | undefined): ArriveBy | null {
  if (value === "fly" || value === "train" || value === "bus" || value === "road") return value;
  return null;
}

/** Catalog and policy lines. Each one is a TripWeave fact, not an official visa source. */
export function stayFactLines(input: AskGrounding): string[] {
  if (!input.packageId) return [];
  const pkg = getPackage(input.packageId);
  if (!pkg) return [];
  const lines = [`TripWeave stay: ${pkg.name}, Puri. The street address is not on file.`];
  const room = input.roomId ? pkg.rooms.find((row) => row.id === input.roomId) : undefined;
  if (room) lines.push(`TripWeave room: ${room.name}.`);
  if (input.checkIn && isRealIsoDate(input.checkIn)) {
    lines.push(`TripWeave check-in: ${input.checkIn}.`);
    // No status means no booking yet: quote the policy. A booked stay is quoted by its status.
    const cancelMode = input.status ? guestCancelMode(input.status) : "refund";
    if (cancelMode === "refund") {
      const policy = refundPolicyFor(input.checkIn);
      let refund = `TripWeave: ${policy.label}.`;
      if (input.amountInr != null && Number.isFinite(input.amountInr) && input.amountInr > 0) {
        refund += ` TripWeave refund if cancelled now: ₹${refundAmountInr(input.amountInr, input.checkIn)}.`;
      }
      lines.push(refund);
    } else if (cancelMode === "no_refund") {
      lines.push("TripWeave: the hotel has confirmed this stay. The guest can still cancel it on My trips, but no refund is issued.");
    }
  }
  if (input.nights != null && Number.isInteger(input.nights) && input.nights >= 1 && input.nights <= 14) {
    lines.push(`TripWeave nights: ${input.nights}.`);
  }
  const mode = asArriveBy(input.arriveBy);
  if (mode === "fly" && pickupQuoteFor(pkg.id, "fly").available) {
    lines.push(
      "TripWeave: this fly arrival includes the hotel airport car both ways. The hotel bills the BBI car. TripWeave adds ₹0.",
    );
  } else {
    lines.push("TripWeave: no TripWeave airport car. Ola, Uber, and Odisha Yatri stay available. TripWeave adds ₹0.");
  }
  if (input.status === "paid") {
    lines.push("TripWeave: payment received. The hotel has not confirmed this stay yet.");
  } else if (input.status === "desk_confirmed" || input.status === "confirmed") {
    lines.push("TripWeave: the hotel has confirmed this stay.");
  } else if (input.status === "checked_in" || input.status === "completed") {
    lines.push("TripWeave: this stay is checked in.");
  } else if (input.status === "cancelled") {
    lines.push("TripWeave: this stay is cancelled. Do not use its voucher at the hotel.");
  } else if (input.status === "refunded") {
    lines.push("TripWeave: this stay is cancelled and refunded. Do not use its voucher at the hotel.");
  }
  return lines;
}

/** Checklist sentences, their official URLs, and TripWeave stay facts. */
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
  for (const fact of stayFactLines(input)) lines.push(`- ${fact}`);
  if (!input.packageId) lines.push("- Stay: a hotel in Puri, Odisha. The street address is not on file.");
  lines.push("Rules checked 19 Oct 2026.");
  return { text: lines.join("\n"), urls };
}

type PacketLine = { text: string; official: boolean };

function linesOf(packet: { text: string; urls: string[] }): PacketLine[] {
  return packet.text
    .split("\n")
    .map((raw) => raw.replace(/^- /, "").trim())
    .filter((text) => text && !text.startsWith("Rules checked"))
    .map((text) => ({ text, official: packet.urls.some((url) => text.includes(url)) }));
}

function wants(question: string, words: string[]): boolean {
  const q = question.toLowerCase();
  return words.some((word) => q.includes(word));
}

/**
 * Answer from the checklist and the stay. No outside model.
 * Official lines keep their URL. Stay lines keep the word TripWeave.
 */
export function answerFromOwnSources(
  question: string,
  packet: { text: string; urls: string[] },
  locale: "en" | "hi" = "en",
): string {
  const lines = linesOf(packet);
  let picked: PacketLine[] = [];
  if (wants(question, ["refund", "cancel", "money", "रद्द", "रिफंड"])) {
    picked = lines.filter((line) => /refund|cancel/i.test(line.text));
  } else if (wants(question, ["car", "pickup", "cab", "taxi", "airport", "कार"])) {
    picked = lines.filter((line) => /car|ola|airport/i.test(line.text));
  } else if (wants(question, ["confirm", "desk", "paid", "status", "पुष्टि"])) {
    picked = lines.filter((line) => /confirm|payment|checked|cancel/i.test(line.text));
  } else if (wants(question, ["visa", "passport", "arrival", "suvidha", "form", "oci"])) {
    picked = lines.filter((line) => line.official);
  } else if (wants(question, ["fly", "flight", "उड़ान"])) {
    picked = [
      ...lines.filter((line) => /car|airport/i.test(line.text)),
      ...lines.filter((line) => line.official),
    ].slice(0, 4);
  } else {
    picked = [...lines.filter((line) => line.text.includes("TripWeave")).slice(0, 2), ...lines.filter((line) => line.official).slice(0, 2)];
  }
  if (picked.length === 0) picked = lines.slice(0, 3);
  const note =
    locale === "hi"
      ? "TripWeave: यह उत्तर ट्रिपवीव के अपने नियमों से है। सरकारी पंक्तियाँ अंग्रेज़ी में हैं। "
      : "";
  return `${note}${picked.map((line) => line.text).join(" ")}`.replace(/\s+/g, " ").trim();
}

export function fallbackAnswer(urls: string[]): string {
  return `${FALLBACK_START}${urls[0] ?? "https://indianvisaonline.gov.in/evisa/"}`;
}

/**
 * Keep an entry answer that cites one packet URL and no other site,
 * a TripWeave answer that names TripWeave and has no URL,
 * or a mixed answer that does both.
 */
export function acceptGroundedReply(reply: string, urls: string[]): string {
  const text = reply.replace(/\s+/g, " ").trim().slice(0, 1200);
  if (!text) return fallbackAnswer(urls);
  const found = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  const foreign = found.some((url) => !urls.some((allowed) => url.startsWith(allowed)));
  if (foreign) return fallbackAnswer(urls);
  const citesPacket = urls.some((url) => text.includes(url));
  const tripWeaveOnly = text.includes("TripWeave") && found.length === 0;
  if (citesPacket || tripWeaveOnly) return text;
  return fallbackAnswer(urls);
}
