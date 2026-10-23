import { checklistForParty, SOURCES, type ChecklistItem, type SourceId } from "./arrival-rules.ts";
import { isRealIsoDate } from "./check-in.ts";
import { getPackage } from "./packages.ts";
import { isCancellableStatus, refundAmountInr, refundPolicyFor, stayStatusLabel } from "./refund-policy.ts";
import type { ArriveBy } from "./origins.ts";
import { pickupQuoteFor } from "./travel-plan.ts";

/**
 * Ask TripWeave answer engine.
 * Deterministic: it matches the question to topics by keyword and replies with the exact
 * stay fact lines and arrival-rules checklist lines for those topics. No outside API, no AI model.
 * Nothing in an answer is written by anything other than this file and arrival-rules.ts.
 */

const FALLBACK_START = "Not stated by the official sources TripWeave checked; see ";
const DEFAULT_URL = SOURCES.evisa.url;
const RULES_CHECKED = "Rules checked 19 Oct 2026.";

/* ---------------------------------------------------------------- documents */

/** Separators that may sit between digit groups of one number. Repeats count as one join. */
const JOINER = "[\\s.,/_-]";
/** An ISO date that is not glued to another digit by nothing or by a single non-space separator. */
const ISO_DATE = /(?<!\d[.,/_-]?)(\d{4}-\d{2}-\d{2})(?![.,/_-]?\d)/g;
const DIGIT_RUN = new RegExp(`\\d+(?:${JOINER}+\\d+)*`, "g");

/**
 * A document-like run: six or more digits joined by any run of spaces, hyphens, dots,
 * commas, slashes or underscores. Only a real calendar ISO date (YYYY-MM-DD) is ignored.
 */
export function questionHasDocumentDigits(question: string): boolean {
  const withoutDates = question.replace(ISO_DATE, (match) => (isRealIsoDate(match) ? " " : match));
  const runs = withoutDates.match(DIGIT_RUN) ?? [];
  return runs.some((run) => run.replace(/\D/g, "").length >= 6);
}

/* ---------------------------------------------------------------- inputs */

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
  /** A confirmation code was given but it is not this signed-in guest's booking. */
  notOwner?: boolean;
};

export type AskTopic =
  | "refund"
  | "car"
  | "status"
  | "checkin"
  | "nights"
  | "room"
  | "paid"
  | "stay"
  | "evisa"
  | "voa"
  | "earrival"
  | "airsuvidha"
  | "formiii"
  | "airports"
  | "oci"
  | "passport"
  | "ticket"
  | "yellowfever"
  | "fly";

type Fact = { text: string; topics: AskTopic[]; url: string | null };

function asArriveBy(value: string | undefined): ArriveBy | null {
  if (value === "fly" || value === "train" || value === "bus" || value === "road") return value;
  return null;
}

export const OWNER_ONLY_LINE =
  "TripWeave: only the booking owner can see this. Sign in with the account that made this booking to see whether the hotel has confirmed it.";

/* ---------------------------------------------------------------- stay facts */

function stayFacts(input: AskGrounding): Fact[] {
  if (!input.packageId) return [];
  const pkg = getPackage(input.packageId);
  if (!pkg) return [];
  const facts: Fact[] = [];
  const add = (text: string, ...topics: AskTopic[]) => facts.push({ text, topics, url: null });
  add(`TripWeave stay: ${pkg.name}, Puri. The street address is not on file.`, "stay");
  const room = input.roomId ? pkg.rooms.find((row) => row.id === input.roomId) : undefined;
  if (room) add(`TripWeave room: ${room.name}.`, "room");
  const status = input.status ?? null;
  const hasAmount = input.amountInr != null && Number.isFinite(input.amountInr) && input.amountInr > 0;
  if (input.checkIn && isRealIsoDate(input.checkIn)) {
    add(`TripWeave check-in: ${input.checkIn}.`, "checkin");
    if (status === "refund_pending") {
      add("TripWeave: a refund for this stay is already in progress.", "refund", "status");
    } else if (status && !isCancellableStatus(status)) {
      add(
        `TripWeave: no refund quote. This stay (${stayStatusLabel(status)}) cannot be cancelled online.`,
        "refund",
      );
    } else {
      const policy = refundPolicyFor(input.checkIn);
      let refund = `TripWeave: ${policy.label}.`;
      if (status && hasAmount) {
        refund += ` TripWeave refund if cancelled now: ₹${refundAmountInr(input.amountInr!, input.checkIn)}.`;
      }
      add(refund, "refund");
    }
  }
  if (input.nights != null && Number.isInteger(input.nights) && input.nights >= 1 && input.nights <= 14) {
    add(`TripWeave nights: ${input.nights}.`, "nights");
  }
  if (status && hasAmount) add(`TripWeave amount paid: ₹${input.amountInr}.`, "paid");
  const mode = asArriveBy(input.arriveBy);
  const hotelCar = pickupQuoteFor(pkg.id, "fly").available;
  if (mode === "fly" && hotelCar) {
    add(
      "TripWeave: this fly arrival includes the hotel airport car both ways. The hotel bills the BBI car. TripWeave adds ₹0.",
      "car",
    );
  } else if (mode === null && hotelCar) {
    add(
      "TripWeave: for guests who fly in to Bhubaneswar (BBI), this hotel offers its own airport car both ways. The hotel bills it. TripWeave adds ₹0. Ola, Uber, and Odisha Yatri stay available.",
      "car",
    );
  } else if (mode === null) {
    add(
      "TripWeave: this hotel does not list its own airport car for guests who fly in. Ola, Uber, and Odisha Yatri stay available. TripWeave adds ₹0.",
      "car",
    );
  } else {
    add("TripWeave: no TripWeave airport car. Ola, Uber, and Odisha Yatri stay available. TripWeave adds ₹0.", "car");
  }
  if (status === "paid") {
    add("TripWeave: payment received. The hotel has not confirmed this stay yet.", "status");
  } else if (status === "held") {
    add("TripWeave: this stay is held. Payment is not complete yet.", "status");
  } else if (status === "desk_confirmed" || status === "confirmed") {
    add("TripWeave: the hotel has confirmed this stay.", "status");
  } else if (status === "checked_in" || status === "completed") {
    add("TripWeave: this stay is checked in.", "status");
  } else if (status === "cancelled" || status === "refunded") {
    add("TripWeave: this stay is closed.", "status", "refund");
  }
  return facts;
}

/** Catalog and policy lines. Each one is a TripWeave fact, not an official visa source. */
export function stayFactLines(input: AskGrounding): string[] {
  return stayFacts(input).map((fact) => fact.text);
}

/* ---------------------------------------------------------------- checklist facts */

const ITEM_TOPICS: Record<string, AskTopic[]> = {
  "evisa-apply": ["evisa", "fly"],
  "evisa-not-for": ["evisa"],
  "not-listed": ["evisa", "voa", "fly"],
  "pk-visa": ["evisa", "voa", "fly"],
  voa: ["voa", "airports", "fly"],
  "voa-bbi": ["voa", "evisa", "airports", "fly"],
  visafree: ["voa", "evisa", "fly"],
  earrival: ["earrival", "fly"],
  "earrival-check": ["earrival", "fly"],
  airsuvidha: ["airsuvidha", "fly"],
  passport: ["passport", "fly"],
  ticket: ["ticket", "fly"],
  formiii: ["formiii", "passport", "fly"],
  "india-address": ["earrival", "stay"],
  "yellow-fever": ["yellowfever", "fly"],
};

function checklistFacts(input: AskGrounding): Fact[] {
  const items: ChecklistItem[] = checklistForParty({
    nationalities: input.nationalities,
    oci: input.oci,
    priorIndianVisa: input.priorIndianVisa,
    arrivalAirport: input.arrivalAirport ?? "BBI",
    arrivalDate: input.checkIn,
  });
  return items.map((row) => {
    const topics = [...(ITEM_TOPICS[row.id] ?? ["fly"])];
    if (/\bOCI\b/.test(row.text)) topics.push("oci");
    return { text: row.text, topics, url: SOURCES[row.sourceId].url };
  });
}

/** Checklist sentences, their official URLs, and TripWeave stay facts. */
export function groundingPacket(input: AskGrounding): { text: string; urls: string[] } {
  const urls: string[] = [];
  const lines = checklistFacts(input).map((fact) => {
    if (fact.url && !urls.includes(fact.url)) urls.push(fact.url);
    return `- ${fact.text} (${fact.url})`;
  });
  if (urls.length === 0) urls.push(DEFAULT_URL);
  for (const fact of stayFactLines(input)) lines.push(`- ${fact}`);
  if (!input.packageId) lines.push("- Stay: a hotel in Puri, Odisha. The street address is not on file.");
  lines.push(RULES_CHECKED);
  return { text: lines.join("\n"), urls };
}

export function fallbackAnswer(urls: string[]): string {
  return `${FALLBACK_START}${urls[0] ?? DEFAULT_URL}`;
}

/* ---------------------------------------------------------------- topics */

const TOPIC_WORDS: [AskTopic, RegExp][] = [
  ["refund", /\b(refunds?|refunded|cancel\w*|money back)\b|रिफंड|रद्द|वापसी/],
  ["car", /\b(car|cars|cab|cabs|taxi|taxis|pick[ -]?up|pickups?|drop|drop-?off|transfers?|shuttle|chauffeur)\b|कार|पिकअप|टैक्सी/],
  ["status", /\b(confirm|confirms|confirmed|confirmation|status|approved|accepted)\b|पुष्टि|स्थिति/],
  ["checkin", /\bcheck[ -]?in\b|\bcheckin\b|arrival date|\b(what|which) (date|day)\b|चेक[- ]?इन/],
  ["nights", /\bnights?\b|how long|how many days|रातें|रात/],
  ["room", /\brooms?\b|कमरा|कमरे/],
  ["paid", /\b(paid|amount|price|cost|charged?|how much)\b|भुगतान|कितना/],
  ["stay", /\b(which|what) hotel\b|hotel name|where (am|do|will) i stay|where i('| a)?m staying|\baddress\b|\bstreet\b|पता/],
  ["evisa", /\be[- ]?visa\b|\bevisa\b|ई-?वीज़ा|ई-?वीजा/],
  ["voa", /visa[- ]on[- ]arrival|\bvoa\b|arrival visa|visa[- ]free|without a visa|need a visa/],
  ["earrival", /\be[- ]?arrival\b|arrival card|landing card|disembarkation|ई-?अराइवल/],
  ["airsuvidha", /air ?suvidha|health (self[- ])?declaration|self[- ]declaration|health form|एयर सुविधा/],
  ["formiii", /\bform ?(iii|3|c)\b|\bfrro\b|\bc[- ]form\b|report\w* (to )?(the )?(police|frro|foreign)/],
  ["airports", /check ?posts?|ports? of entry|entry points?|which airports?|\bairports\b|land at|fly into/],
  ["oci", /\boci\b|overseas citizen/],
  ["passport", /\bpassports?\b|पासपोर्ट/],
  ["ticket", /\btickets?\b|onward|return flight/],
  ["yellowfever", /yellow[- ]?fever|vaccin/],
  ["fly", /before i (fly|travel|leave)|what (should|do) i (do|need|bring|carry)|prepare|checklist|\bdocuments?\b|need to (do|bring|carry)|उड़ान/],
];

const TOPIC_SOURCE: Partial<Record<AskTopic, SourceId>> = {
  evisa: "evisa",
  voa: "boi_voa",
  airports: "evisa_faq",
  earrival: "earrival",
  airsuvidha: "airsuvidha_portal",
  formiii: "formiii",
  oci: "earrival_boi",
  passport: "evisa_faq",
  ticket: "evisa_faq",
  yellowfever: "evisa_faq",
  fly: "evisa",
};

export function topicsFor(question: string): AskTopic[] {
  const text = question.toLowerCase().replace(/\s+/g, " ");
  const found = new Set<AskTopic>();
  for (const [topic, words] of TOPIC_WORDS) if (words.test(text)) found.add(topic);
  // "airport" alone means arrival airports, unless the guest is asking about a car.
  if (/\bairport\b/.test(text) && !found.has("car")) found.add("airports");
  // A bare "visa" covers both the e-Visa and visa-on-arrival lines.
  if (/\bvisa\b|वीज़ा|वीजा/.test(text) && !found.has("evisa") && !found.has("voa")) {
    found.add("evisa");
    found.add("voa");
  }
  return [...found];
}

/* ---------------------------------------------------------------- suggestions and limits */

export const ASK_SUGGESTIONS = {
  fly: "What should I do before I fly?",
  refund: "What is the refund if I cancel?",
  car: "Does this hotel include an airport car?",
  desk: "Has the hotel confirmed this stay?",
} as const;

export type AskSuggestion = keyof typeof ASK_SUGGESTIONS;

/**
 * Free-text questions keep the 10 per hour limit. Fixed suggestion taps are cheap
 * deterministic lookups, so they use their own, larger bucket and never use up typed asks.
 */
export const ASK_LIMITS = {
  typed: { limit: 10, windowMs: 60 * 60_000 },
  suggestion: { limit: 60, windowMs: 60 * 60_000 },
} as const;

export function askBucket(userId: string, suggestion?: AskSuggestion | null) {
  if (suggestion) return { name: `ask-suggest:${userId}`, ...ASK_LIMITS.suggestion };
  return { name: `ask:${userId}`, ...ASK_LIMITS.typed };
}

/* ---------------------------------------------------------------- answer */

export type AskAnswer = { answer: string; topics: AskTopic[]; matched: boolean };

/**
 * Build the reply only from stay facts and arrival-rules lines whose topics match the question.
 * Each checklist line carries its official source URL. Nothing else can appear in the reply.
 */
export function answerQuestion(question: string, input: AskGrounding): AskAnswer {
  const topics = topicsFor(question);
  const checklist = checklistFacts(input);
  const stay = stayFacts(input);
  const lines: string[] = [];
  let official = false;
  const want = new Set(topics);
  const ownerOnly = input.notOwner === true && (want.has("status") || want.has("paid"));
  if (ownerOnly) lines.push(OWNER_ONLY_LINE);
  for (const fact of stay) {
    if (ownerOnly && fact.topics.some((topic) => topic === "status" || topic === "paid")) continue;
    if (fact.topics.some((topic) => want.has(topic)) && !lines.includes(fact.text)) lines.push(fact.text);
  }
  for (const fact of checklist) {
    if (!fact.topics.some((topic) => want.has(topic))) continue;
    const line = `${fact.text} (${fact.url})`;
    if (!lines.includes(line)) {
      lines.push(line);
      official = true;
    }
  }
  if (lines.length === 0) {
    const first = topics.map((topic) => TOPIC_SOURCE[topic]).find(Boolean);
    const urls = first ? [SOURCES[first].url] : groundingPacket(input).urls;
    return { answer: fallbackAnswer(urls), topics, matched: false };
  }
  if (official) lines.push(RULES_CHECKED);
  return { answer: lines.join("\n"), topics, matched: true };
}
