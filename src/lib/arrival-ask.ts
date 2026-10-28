import { checklistForParty, SOURCES, type ChecklistItem, type SourceId } from "./arrival-rules.ts";
import { isRealIsoDate } from "./check-in.ts";
import { deskFor } from "./hotel-desk.ts";
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

const ND = /\p{Nd}/u;

/** Map every Unicode decimal digit (Arabic-Indic, Devanagari, fullwidth, ...) to ASCII 0-9. */
export function asciiDigits(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFKC")) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
      continue;
    }
    if (!ND.test(ch)) {
      out += ch;
      continue;
    }
    // Unicode digits come in runs of ten starting at zero. Walk back to the start of the run.
    const cp = ch.codePointAt(0)!;
    let start = cp;
    while (start > 0 && ND.test(String.fromCodePoint(start - 1))) start -= 1;
    out += String((cp - start) % 10);
  }
  return out;
}

/** Separators that may sit between digit groups of one number. Repeats count as one join. */
const JOINER = "[\\s.,/_\\-\u2010-\u2015]";
/** A date-shaped token: YYYY-MM-DD or DD-MM-YYYY with -, / or . (the day may be a typo such as 30 Feb). */
const DATE =
  "(?:(?:19|20)\\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\\d|3[01])|(?:0?[1-9]|[12]\\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)\\d{2})";
/** Two dates joined as a range: 2027-06-15/2027-06-16, 15/06/2027 - 16/06/2027, 2027-06-15 to 2027-06-20. */
const DATE_RANGE = new RegExp(
  `(?<![\\dA-Za-z])${DATE}\\s*(?:[-/~\u2013\u2014]|to|till|until)\\s*${DATE}(?![\\dA-Za-z])`,
  "gi",
);
/** One date that is not glued to another digit or letter by nothing or by a single separator. */
const ONE_DATE = new RegExp(`(?<![\\dA-Za-z][.,/_-]?)${DATE}(?![.,/_-]?[\\dA-Za-z])`, "g");
/** A token that holds at least one digit (letters glued to digits count, e.g. K12A34B56C78). */
const DIGIT_TOKEN = "[A-Za-z]*\\d[A-Za-z\\d]*";
const DOC_RUN = new RegExp(`${DIGIT_TOKEN}(?:${JOINER}+${DIGIT_TOKEN})*`, "g");

/**
 * True when the text looks like it holds a passport, visa, ID, phone or card number:
 * six or more digits in one run, where a run is digit-bearing tokens (letters may be glued
 * to the digits) joined by spaces, hyphens, dots, commas, slashes or underscores.
 * Unicode digits are mapped to ASCII first. Date-shaped tokens and date ranges are ignored.
 */
export function questionHasDocumentDigits(question: string): boolean {
  const text = asciiDigits(question)
    .replace(DATE_RANGE, " | ")
    .replace(ONE_DATE, " | ");
  const runs = text.match(DOC_RUN) ?? [];
  return runs.some((run) => run.replace(/\D/g, "").length >= 6);
}

/** Stored in place of a question that was blocked as a document number. Never the original text. */
export const REDACTED_QUESTION = "[Question not saved: it looked like a passport, visa or ID number.]";

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
  | "includes"
  | "checkout"
  | "desk"
  | "distance"
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

function checkOutDate(checkIn: string, nights: number): string {
  const day = new Date(`${checkIn}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + nights);
  return day.toISOString().slice(0, 10);
}

function deskLine(packageId: string): string {
  const desk = deskFor(packageId);
  return `TripWeave: the hotel desk is ${desk.note}, ${desk.email}${desk.phone ? `, ${desk.phone}` : ""}.`;
}

/** The reply for a stay question TripWeave has no fact for. Never an official visa link. */
/** Every traveller on file is an Indian national, so no foreign-arrival checklist line applies. */
export const INDIAN_PARTY_LINE =
  "TripWeave: everyone on this booking is listed as an Indian national, so the foreign-arrival steps (e-Visa, e-Arrival card, Form III) do not apply. Carry the ID you entered at checkout for hotel check-in.";

function allIndianParty(nationalities: string[]): boolean {
  return nationalities.length > 0 && nationalities.every((code) => code === "IN");
}

export function tripweaveFallback(packageId?: string): string {
  const pkg = packageId ? getPackage(packageId) : undefined;
  if (!pkg) return "TripWeave does not have this on file. Ask the hotel desk; the contact is on your voucher.";
  const desk = deskFor(pkg.id);
  return `TripWeave does not have this on file. Ask the hotel desk: ${desk.note}, ${desk.email}${desk.phone ? `, ${desk.phone}` : ""}.`;
}

function stayFacts(input: AskGrounding): Fact[] {
  if (!input.packageId) return [];
  const pkg = getPackage(input.packageId);
  if (!pkg) return [];
  const facts: Fact[] = [];
  const add = (text: string, ...topics: AskTopic[]) => facts.push({ text, topics, url: null });
  add(`TripWeave stay: ${pkg.name}, Puri. The street address is not on file.`, "stay");
  const room = input.roomId ? pkg.rooms.find((row) => row.id === input.roomId) : undefined;
  if (room) add(`TripWeave room: ${room.name}.`, "room");
  if (pkg.includes.length > 0) {
    add(
      `TripWeave: ${pkg.name} lists these with the stay: ${pkg.includes.join(", ")}. Times and menus are not on file. Ask the hotel desk.`,
      "includes",
    );
  }
  const nightsOk = input.nights != null && Number.isInteger(input.nights) && input.nights >= 1 && input.nights <= 14;
  if (input.checkIn && isRealIsoDate(input.checkIn) && nightsOk) {
    add(
      `TripWeave check-out: ${checkOutDate(input.checkIn, input.nights!)}. The check-out time is not on file. Ask the hotel desk.`,
      "checkout",
    );
  }
  add(deskLine(pkg.id), "desk");
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
        refund += ` TripWeave refund if cancelled now: ₹${refundAmountInr(input.amountInr!, input.checkIn).toLocaleString("en-IN")}.`;
      }
      add(refund, "refund");
    }
  }
  if (input.nights != null && Number.isInteger(input.nights) && input.nights >= 1 && input.nights <= 14) {
    add(`TripWeave nights: ${input.nights}.`, "nights");
  }
  if (status && hasAmount) add(`TripWeave amount paid: ₹${input.amountInr!.toLocaleString("en-IN")}.`, "paid");
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
  ["includes", /\b(breakfast|lunch|dinner|meals?|food|buffet|pool|spa|gym|parking|wi-?fi|amenit(y|ies)|facilit(y|ies))\b|what('?s| is) included|what comes with|नाश्ता/],
  ["checkout", /\bcheck[ -]?out\b|\bcheckout\b|leave the (hotel|room)|चेक[- ]?आउट/],
  ["desk", /\b(contact|email|phone|call|reach) (the )?(hotel|desk|reception)\b|hotel (desk|email|phone|contact)/],
  ["distance", /\bhow far\b|\bfar (from|to)\b|\bdistance\b|\bkms?\b|kilomet/],
  ["stay", /\b(which|what) hotel\b|hotel name|where (am|do|will) i stay|where i('| a)?m staying|\baddress\b|\bstreet\b|पता/],
  ["evisa", /\be[- ]?visa\b|\bevisa\b|ई-?वीज़ा|ई-?वीजा/],
  ["voa", /visa[- ]on[- ]arrival|\bvoa\b|arrival visa/],
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

/**
 * Wording right before a keyword (same clause) that means the guest does not want it:
 * "don't need a car", "do not want a pickup", "no taxi", "won't book a cab".
 * Plain "not" elsewhere ("what if I do not get my e-Visa") does not negate.
 */
const NEGATION =
  /(?:\b(?:don'?t|do not|doesn'?t|does not|didn'?t|did not|won'?t|will not|not|never)\s+(?:need|want|require|use|book|take)\b(?:\s+\S+){0,2}|\bno(?:\s+(?:need for|thanks to))?(?:\s+(?:a|an|the|any))?)\s*$/;

/** Split into clauses so "I don't need a car, do I need a visa?" negates only the car. */
function clauses(text: string): string[] {
  return text.split(/[,.;!?]|\bbut\b|\balso\b|\band\b|\bthough\b|लेकिन/).map((part) => part.trim()).filter(Boolean);
}

/** True when every match of `words` in this clause sits right after a negation (within four words). */
function onlyNegated(clause: string, words: RegExp): boolean {
  const flags = words.flags.includes("g") ? words.flags : `${words.flags}g`;
  const all = [...clause.matchAll(new RegExp(words.source, flags))];
  if (all.length === 0) return false;
  return all.every((match) => {
    const before = clause.slice(0, match.index).trim().split(/\s+/).slice(-5).join(" ");
    return NEGATION.test(before);
  });
}

function matches(text: string, words: RegExp): boolean {
  return clauses(text).some((clause) => words.test(clause) && !onlyNegated(clause, words));
}

const BOOKING_WORD = /\b(paid|charged|booking|stay|room|hotel|tripweave)\b|भुगतान/;
const VISA_WORD = /\bvisas?\b|वीज़ा|वीजा/;
const AIRPORT_WORD = /\bairport\b/;

export function topicsFor(question: string): AskTopic[] {
  const text = question.toLowerCase().replace(/\s+/g, " ");
  const found = new Set<AskTopic>();
  for (const [topic, words] of TOPIC_WORDS) if (matches(text, words)) found.add(topic);
  // "airport" alone means arrival airports, unless the guest is asking about a car.
  if (matches(text, AIRPORT_WORD) && !found.has("car") && !found.has("distance") && !/\b(car|cab|taxi|pick)/.test(text)) {
    found.add("airports");
  }
  // A generic visa question ("Do I need a visa?", "visa-free?", "without a visa") covers
  // both the e-Visa and visa-on-arrival lines.
  if (matches(text, VISA_WORD) && !found.has("evisa") && !found.has("voa")) {
    found.add("evisa");
    found.add("voa");
  }
  // "How much is the e-Visa fee?" asks about an entry rule, not the booking. Keep the
  // amount-paid line only when the question also names the booking.
  if (found.has("paid") && [...found].some((topic) => !STAY_TOPICS.has(topic)) && !BOOKING_WORD.test(text)) {
    found.delete("paid");
  }
  return [...found];
}

/** Topics TripWeave answers from its own booking data. Anything else is an entry-rule topic. */
const STAY_TOPICS = new Set<AskTopic>([
  "refund",
  "car",
  "status",
  "checkin",
  "nights",
  "room",
  "paid",
  "stay",
  "includes",
  "checkout",
  "desk",
  "distance",
]);

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
    // Nothing matched, or only TripWeave stay topics with no fact on file (breakfast time,
    // check-out time, distance): answer as TripWeave, never with an e-Visa link.
    const entryTopics = topics.filter((topic) => !STAY_TOPICS.has(topic));
    if (entryTopics.length === 0) return { answer: tripweaveFallback(input.packageId), topics, matched: false };
    if (checklist.length === 0 && allIndianParty(input.nationalities)) {
      return { answer: INDIAN_PARTY_LINE, topics, matched: true };
    }
    const first = entryTopics.map((topic) => TOPIC_SOURCE[topic]).find(Boolean);
    const urls = first ? [SOURCES[first].url] : groundingPacket(input).urls;
    return { answer: fallbackAnswer(urls), topics, matched: false };
  }
  if (official) lines.push(RULES_CHECKED);
  return { answer: lines.join("\n"), topics, matched: true };
}
