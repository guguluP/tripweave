import { FESTIVAL } from "./inventory.ts";
import { GATEWAYS, LANDMARKS, type Pin } from "./places.ts";
import { visitReply, type AskPoint, type RoadLeg } from "./visit-places.ts";

/** IMD's public Puri city page. The JSON API needs a key this app does not buy. */
export const IMD_PURI_URL = "https://city.imd.gov.in/citywx/citywxnew_warnings.php?id=43053";

export const ASK_LIMIT =
  "TripWeave can answer about this stay, places to see, distances, arrival papers, the refund, and today's Puri weather, and it does not have an answer for that question.";

export type LocalBulletin =
  | { ok: true; observed: string; today: string; warning: string }
  | { ok: false };

type Fact = { text: string; official: boolean };

export type AskReply = { text: string; markers: AskPoint[] };

type AskOptions = {
  history?: { question: string }[];
  arriveBy?: string;
  bulletin?: LocalBulletin | null;
  from?: Pin | null;
  roads?: RoadLeg[];
};

function reply(text: string, markers: AskPoint[] = []): AskReply {
  return { text, markers };
}

const STAY_BLOCK =
  /\b(refund|cancel|cancellation|visa|passport|e-?visa|oci|checklist|pickup|desk|confirmed|confirmation|\broom\b|nights)\b/i;

const LOCAL =
  /\b(weather|forecast|temperature|rain|raining|cyclone|storm|thunder|warning|humid|humidity|wind|heat|news|latest)\b/i;

const GENERIC = new Set([
  "puri",
  "tripweave",
  "odisha",
  "this",
  "that",
  "your",
  "about",
  "please",
  "tell",
  "what",
  "when",
  "where",
  "how",
  "should",
  "before",
  "does",
  "have",
  "with",
  "from",
  "the",
  "and",
  "for",
  "can",
  "you",
  "need",
  "hotel",
  "stay",
]);

/** Weather, a warning, or a local update. Money, papers, the room, and the desk do not qualify. */
export function needsLocalConditions(question: string): boolean {
  if (STAY_BLOCK.test(question)) return false;
  return LOCAL.test(question);
}

export function formatBulletin(bulletin: LocalBulletin): string {
  if (!bulletin.ok) {
    return `Today's Puri forecast could not be checked. India Meteorological Department: ${IMD_PURI_URL}`;
  }
  return `India Meteorological Department, Puri. ${bulletin.observed} Today: ${bulletin.today} Warning: ${bulletin.warning} ${IMD_PURI_URL}`;
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 3 || /[\u0900-\u097F]/.test(word));
}

function add(tags: Set<string>, values: string[]) {
  for (const value of values) tags.add(value);
}

function tagsFor(text: string, official: boolean): Set<string> {
  const tags = new Set(words(text));
  if (/refund|cancel/i.test(text)) add(tags, ["refund", "cancel", "money"]);
  if (/car|ola|uber|yatri|airport|cab/i.test(text)) add(tags, ["car", "pickup", "cab", "taxi", "airport", "ola", "uber"]);
  if (/confirm|payment received|checked in|cancelled|refunded/i.test(text)) {
    add(tags, ["confirm", "desk", "paid", "status"]);
  }
  if (/straight-line|jagannath|sea beach|railway|map marks|neighbourhood|neighborhood| is in /i.test(text)) {
    add(tags, ["nearby", "near", "around", "location", "beach", "temple", "station", "walk"]);
  }
  if (/rath yatra/i.test(text)) add(tags, ["rath", "yatra", "festival"]);
  if (official) add(tags, ["visa", "passport", "arrival", "checklist", "oci", "form", "suvidha", "fly"]);
  return tags;
}

function packetFacts(packet: { text: string; urls: string[] }): Fact[] {
  return packet.text
    .split("\n")
    .map((raw) => raw.replace(/^- /, "").trim())
    .filter((text) => text && !text.startsWith("Rules checked"))
    .map((text) => ({ text, official: packet.urls.some((url) => text.includes(url)) }));
}

function contextFacts(arriveBy?: string): Fact[] {
  const names = LANDMARKS.map((pin) => pin.label).join(", ");
  const [start, end] = FESTIVAL.find(([from]) => from.startsWith("2027-06")) ?? ["2027-06-15", "2027-06-25"];
  const facts: Fact[] = [
    { text: `TripWeave: the Puri map marks ${names}.`, official: false },
    { text: `TripWeave: Rath Yatra ${start.slice(0, 4)} is ${start} through ${end}.`, official: false },
    {
      text: "TripWeave: cab links on the page open Odisha Yatri, Ola, and Uber. TripWeave adds ₹0.",
      official: false,
    },
  ];
  if (arriveBy === "fly" || arriveBy === "road") {
    facts.push({ text: `TripWeave: this plan arrives by ${arriveBy} via ${GATEWAYS.bbi.label}.`, official: false });
  } else if (arriveBy === "train") {
    facts.push({ text: "TripWeave: this plan arrives by train via Puri railway station.", official: false });
  } else if (arriveBy === "bus") {
    facts.push({ text: `TripWeave: this plan arrives by bus via ${GATEWAYS.bus.label}.`, official: false });
  }
  return facts;
}

function questionTerms(question: string, history: { question: string }[] | undefined): Set<string> {
  const own = words(question).filter((word) => !GENERIC.has(word));
  const followUp = /^(and|also|what about|how about)\b/i.test(question.trim()) || own.length <= 1;
  const source = followUp && history?.length ? `${history[history.length - 1]?.question ?? ""} ${question}` : question;
  return new Set(words(source).filter((word) => !GENERIC.has(word)));
}

function compose(lines: Fact[]): string {
  return `${lines.map((line) => line.text).join(" ")}`.replace(/\s+/g, " ").trim().slice(0, 1200);
}

/**
 * Answer from owned facts. A local-conditions question uses the bulletin instead,
 * including the failure bulletin when the forecast page could not be read.
 */
export function answerAsk(
  question: string,
  packet: { text: string; urls: string[] },
  opts: AskOptions = {},
): AskReply {
  const visit = visitReply(question, opts.from ?? null, opts.roads);
  if (visit) return visit;
  if (needsLocalConditions(question)) {
    const bulletin = opts.bulletin?.ok ? opts.bulletin : { ok: false as const };
    const text = formatBulletin(bulletin);
    return reply(text);
  }
  const facts = [...packetFacts(packet), ...contextFacts(opts.arriveBy)];
  const terms = questionTerms(question, opts.history);
  if (terms.size === 0) return reply(ASK_LIMIT);
  const ranked = facts
    .map((fact) => {
      const tags = tagsFor(fact.text, fact.official);
      let score = 0;
      for (const term of terms) if (tags.has(term)) score += 1;
      return { fact, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return reply(ASK_LIMIT);
  return reply(compose(ranked.slice(0, 4).map((row) => row.fact)));
}
