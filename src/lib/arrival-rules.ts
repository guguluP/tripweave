/**
 * Official India arrival formalities, paraphrased only enough to list them.
 * Every item cites SOURCES. Re-check when REVIEW_BY passes.
 * Retrieved 19 Oct 2026. Do not hardcode visa fees or yellow-fever country lists.
 */

export const RULES_RETRIEVED_AT = "2026-10-19";

function plusDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year!, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Retrieval date plus 90 days. Tests fail once this date has passed. */
export const REVIEW_BY = plusDays(RULES_RETRIEVED_AT, 90);

/**
 * e-Visa nationalities on indianvisaonline.gov.in, 19 Oct 2026.
 * 175 names, Kenya listed twice, so 174 ISO codes.
 * Not in this set: NP, BT, MV (visa-free), CN, HK, MO, PK, IN.
 */
export const EVISA_CODES: readonly string[] = `
AD AE AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BG BH BI BJ BN BO BR BS BW BY BZ
CA CH CI CK CL CM CO CR CU CV CY CZ DE DJ DK DM DO EC EE ER ES FI FJ FM FR GA GB
GD GE GG GH GI GM GN GQ GR GT GY HN HR HT HU ID IE IL IM IS IT JE JM JO JP KE KG
KH KI KM KN KR KW KY KZ LA LC LI LK LR LS LT LU LV MA MC MD ME MG MH MK ML MM MN
MR MS MT MU MW MX MY MZ NA NE NI NL NO NR NU NZ OM PA PE PG PH PL PS PT PW PY QA
RO RS RU RW SB SC SE SG SI SK SL SM SN SR SV SZ TC TG TH TJ TO TT TV TW TZ UA UG
US UY UZ VA VC VE VN VU WS ZA ZM ZW
`
  .trim()
  .split(/\s+/);

const EVISA_SET = new Set(EVISA_CODES);

/** Japan and Korea visa on arrival. */
const JP_KR_VOA = new Set(["DEL", "BOM", "MAA", "CCU", "BLR", "HYD"]);
/** UAE visa on arrival adds Cochin, Calicut and Ahmedabad. */
const AE_VOA = new Set(["DEL", "BOM", "MAA", "CCU", "BLR", "HYD", "COK", "CCJ", "AMD"]);

export const SOURCES = {
  evisa: {
    title: "India e-Visa",
    url: "https://indianvisaonline.gov.in/evisa/",
    retrievedAt: RULES_RETRIEVED_AT,
  },
  evisa_faq: {
    title: "India e-Visa FAQ and authorised checkposts",
    url: "https://indianvisaonline.gov.in/evisa/tvoa.html",
    retrievedAt: RULES_RETRIEVED_AT,
  },
  boi_voa: {
    title: "Bureau of Immigration, visa-free regime and visa on arrival",
    url: "https://boi.gov.in/boi/",
    retrievedAt: RULES_RETRIEVED_AT,
  },
  earrival: {
    title: "e-Arrival card",
    url: "https://indianvisaonline.gov.in/earrival/",
    retrievedAt: RULES_RETRIEVED_AT,
  },
  earrival_boi: {
    title: "Bureau of Immigration e-Arrival notice",
    url: "https://www.boi.gov.in/boi/public/content/c4b6cab6-41b1-4c37-853f-81b819f81aad",
    retrievedAt: RULES_RETRIEVED_AT,
  },
  airsuvidha: {
    title: "Air Suvidha 2.0, Press Information Bureau",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2277639",
    retrievedAt: RULES_RETRIEVED_AT,
  },
  airsuvidha_portal: {
    title: "Air Suvidha portal",
    url: "https://airsuvidha.civilaviation.gov.in/",
    retrievedAt: RULES_RETRIEVED_AT,
  },
  formiii: {
    title: "Form III (formerly Form C)",
    url: "https://indianfrro.gov.in/frro/FormC",
    retrievedAt: RULES_RETRIEVED_AT,
  },
} as const;

export type SourceId = keyof typeof SOURCES;

export type ChecklistItem = {
  id: string;
  text: string;
  sourceId: SourceId;
  severity: "required" | "check" | "info";
  dueBefore?: { hours?: number; days?: number };
};

export type ChecklistInput = {
  nationality: string;
  oci?: boolean;
  /** IATA code. Defaults to Bhubaneswar. */
  arrivalAirport?: string;
  arrivalDate?: string;
  /** UAE visa on arrival needs an earlier Indian e-Visa or regular visa. */
  priorIndianVisa?: boolean;
};

function airportOf(code: string | undefined): string {
  const airport = (code || "BBI").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(airport) ? airport : "BBI";
}

function item(
  id: string,
  text: string,
  sourceId: SourceId,
  severity: ChecklistItem["severity"],
  dueBefore?: ChecklistItem["dueBefore"],
): ChecklistItem {
  return dueBefore ? { id, text, sourceId, severity, dueBefore } : { id, text, sourceId, severity };
}

function earrival(check: boolean): ChecklistItem {
  if (check) {
    return item(
      "earrival-check",
      "Whether the e-Arrival card applies to nationals of Nepal and Bhutan was not confirmed on 19 Oct 2026. Where it applies, submit it within 72 hours before arrival. It is free and is not a visa.",
      "earrival",
      "check",
      { hours: 72 },
    );
  }
  return item(
    "earrival",
    "e-Arrival is mandatory from 1 Oct 2025 for foreign nationals, including OCI cardholders. Submit it within 72 hours before arrival. It is free and is not a visa.",
    "earrival",
    "required",
    { hours: 72 },
  );
}

function airSuvidha(): ChecklistItem {
  return item(
    "airsuvidha",
    "Since 25 Jun 2026 India has required an online health self-declaration (Air Suvidha) for international arrivals. Check https://airsuvidha.civilaviation.gov.in/ before you fly. The portal was not confirmed up when these rules were read.",
    "airsuvidha",
    "check",
  );
}

function general(): ChecklistItem[] {
  return [
    item(
      "passport",
      "Your passport must be valid for at least 6 months from arrival and have at least 2 blank pages.",
      "evisa_faq",
      "required",
    ),
    item("ticket", "Carry a return or onward ticket.", "evisa_faq", "required"),
    item(
      "formiii",
      "Carry your passport for hotel check-in. Hotels must report foreign guests to the FRRO within 24 hours of arrival (Form III). See https://indianfrro.gov.in/frro/FormC",
      "formiii",
      "info",
      { hours: 24 },
    ),
    item(
      "yellow-fever",
      "If you arrive within 6 days from a yellow-fever endemic country, carry the vaccination certificate. Use the official list on the e-Visa site. TripWeave does not copy that country list.",
      "evisa_faq",
      "check",
    ),
  ];
}

function evisaBody(airport: string, mentionBbi: boolean): ChecklistItem[] {
  const rows = [
    item(
      "evisa-apply",
      "Apply for an e-Visa at least 4 days before arrival, inside the 120-day window. The fee depends on nationality. It is not shown here. Use the official e-Visa site.",
      "evisa",
      "required",
      { days: 4 },
    ),
  ];
  if (mentionBbi && airport === "BBI") {
    rows.push(
      item(
        "voa-bbi",
        "Bhubaneswar (BBI) has no visa on arrival. Get an e-Visa or a regular visa before you fly.",
        "boi_voa",
        "required",
      ),
    );
  }
  rows.push(
    item(
      "evisa-not-for",
      "An e-Visa is not for diplomatic or official passports, people endorsed on a parent or spouse passport, or people with a defence, military, security or police background. Pakistani passport holders and people of Pakistani origin are not eligible.",
      "evisa",
      "info",
    ),
  );
  return rows;
}

function jpKrVoa(): ChecklistItem {
  return item(
    "voa",
    "Visa on arrival is available at Delhi (DEL), Mumbai (BOM), Chennai (MAA), Kolkata (CCU), Bengaluru (BLR) and Hyderabad (HYD). It is up to 60 days and double entry. It is not available to people with Pakistan links.",
    "boi_voa",
    "required",
  );
}

function aeVoa(): ChecklistItem {
  return item(
    "voa",
    "Visa on arrival is available only because a previous Indian e-Visa or regular paper visa was held, and only at Delhi, Mumbai, Chennai, Kolkata, Bengaluru, Hyderabad, Cochin (COK), Calicut (CCJ) and Ahmedabad (AMD). It is up to 60 days and double entry.",
    "boi_voa",
    "required",
  );
}

/**
 * Decision order: IN, OCI, NP/BT/MV, JP/KR, AE, e-Visa set, PK, anything else.
 * Every non-IN result except OCI also gets e-Arrival, Air Suvidha and the general lines.
 * OCI keeps e-Arrival and Air Suvidha only.
 */
export function checklistFor(input: ChecklistInput): ChecklistItem[] {
  const nationality = (input.nationality || "IN").trim().toUpperCase();
  if (nationality === "IN") return [];
  if (input.oci) return [earrival(false), airSuvidha()];

  const airport = airportOf(input.arrivalAirport);
  const head: ChecklistItem[] = [];

  if (nationality === "NP" || nationality === "BT") {
    head.push(
      item(
        "visafree",
        nationality === "NP"
          ? "Nationals of Nepal do not need a visa to enter India."
          : "Nationals of Bhutan do not need a visa to enter India.",
        "boi_voa",
        "info",
      ),
    );
    return [...head, earrival(true), airSuvidha(), ...general()];
  }

  if (nationality === "MV") {
    head.push(
      item(
        "visafree",
        "Nationals of Maldives may enter visa-free for up to 90 days for the purposes listed by the Bureau of Immigration. Confirm the conditions on the official page.",
        "boi_voa",
        "check",
      ),
    );
    return [...head, earrival(false), airSuvidha(), ...general()];
  }

  if (nationality === "JP" || nationality === "KR") {
    if (JP_KR_VOA.has(airport)) head.push(jpKrVoa());
    else head.push(...evisaBody(airport, true));
    return [...head, earrival(false), airSuvidha(), ...general()];
  }

  if (nationality === "AE") {
    if (input.priorIndianVisa && AE_VOA.has(airport)) head.push(aeVoa());
    else head.push(...evisaBody(airport, true));
    return [...head, earrival(false), airSuvidha(), ...general()];
  }

  if (EVISA_SET.has(nationality)) {
    head.push(...evisaBody(airport, false));
    return [...head, earrival(false), airSuvidha(), ...general()];
  }

  if (nationality === "PK") {
    head.push(
      item(
        "pk-visa",
        "Not eligible for an e-Visa. Apply for a regular visa at an Indian mission. People of Pakistani origin through a parent or grandparent must do the same.",
        "evisa",
        "required",
      ),
    );
    return [...head, earrival(false), airSuvidha(), ...general()];
  }

  head.push(
    item(
      "not-listed",
      "Not on the e-Visa eligibility list (checked 19 Oct 2026). Check visa options at https://indianvisaonline.gov.in/evisa/.",
      "evisa",
      "required",
    ),
  );
  return [...head, earrival(false), airSuvidha(), ...general()];
}

export function checklistForParty(input: {
  nationalities: string[];
  oci?: boolean[];
  arrivalAirport?: string;
  arrivalDate?: string;
  priorIndianVisa?: boolean[];
}): ChecklistItem[] {
  const seen = new Set<string>();
  const out: ChecklistItem[] = [];
  input.nationalities.forEach((nationality, index) => {
    for (const row of checklistFor({
      nationality,
      oci: input.oci?.[index],
      arrivalAirport: input.arrivalAirport,
      arrivalDate: input.arrivalDate,
      priorIndianVisa: input.priorIndianVisa?.[index],
    })) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
    }
  });
  return out;
}

/** Plain-text checklist. ASCII only, with a source URL after each item. */
export function renderChecklistText(items: ChecklistItem[], sources: typeof SOURCES = SOURCES): string {
  const lines = items.map((row) => `- ${row.text} (${sources[row.sourceId].url})`);
  lines.push("");
  lines.push("Rules checked 19 Oct 2026. Always confirm on the official sites before you travel.");
  return lines.join("\n");
}

function nonIndianCodes(input: {
  guestNationalities?: string[];
  guests?: { nationality?: string }[];
}): string[] {
  const fromMeta = (input.guestNationalities ?? [])
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code && code !== "IN");
  if (fromMeta.length > 0) return [...new Set(fromMeta)];
  const fromGuests = (input.guests ?? [])
    .map((guest) => (guest.nationality || "").trim().toUpperCase())
    .filter((code) => code && code !== "IN");
  return [...new Set(fromGuests)];
}

export function foreignNationalCount(input: {
  guestNationalities?: string[];
  guests?: { nationality?: string }[];
}): number {
  const people = (input.guests ?? []).filter((guest) => {
    const code = (guest.nationality || "").trim().toUpperCase();
    return code && code !== "IN";
  });
  if (people.length > 0) return people.length;
  return nonIndianCodes(input).length;
}

export function foreignDeskLine(count: number): string {
  if (!count) return "";
  return `Foreign nationals in this booking: ${count}. Form III must be submitted within 24 hours of arrival (https://indianfrro.gov.in/frro/FormC).`;
}

/** Short block appended to the paid-guest mail. Empty when every guest is Indian. */
export function paidAbroadLines(input: {
  guestNationalities?: string[];
  guests?: { nationality?: string }[];
  confirmationCode: string;
  arrivalAirport?: string;
}): string[] {
  const codes = nonIndianCodes(input);
  if (codes.length === 0) return [];
  const top = checklistForParty({ nationalities: codes, arrivalAirport: input.arrivalAirport ?? "BBI" }).slice(0, 3);
  return [
    "Visiting from abroad: before you fly, check your visa, file the e-Arrival card (within 72 h before arrival) and the Air Suvidha health declaration.",
    `Voucher: /voucher/${input.confirmationCode}`,
    ...top.map((row) => `${row.text} ${SOURCES[row.sourceId].url}`),
  ];
}
