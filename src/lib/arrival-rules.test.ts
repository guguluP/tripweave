import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EVISA_CODES,
  REVIEW_BY,
  RULES_RETRIEVED_AT,
  SOURCES,
  checklistFor,
  paidAbroadLines,
  renderChecklistText,
  type ChecklistItem,
} from "./arrival-rules.ts";

function plusDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year!, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function textOf(items: ChecklistItem[]): string {
  return items.map((item) => item.text).join("\n");
}

describe("arrival rules", () => {
  it("returns nothing for an Indian guest", () => {
    assert.deepEqual(checklistFor({ nationality: "IN" }), []);
    assert.deepEqual(checklistFor({ nationality: "IN", oci: true }), []);
  });

  it("lists e-Visa, e-Arrival and Air Suvidha for the United Kingdom", () => {
    const text = textOf(checklistFor({ nationality: "GB" }));
    assert.match(text, /e-Visa/);
    assert.match(text, /e-Arrival/);
    assert.match(text, /Air Suvidha/);
  });

  it("sends Japan to an e-Visa at Bhubaneswar and visa on arrival at Delhi", () => {
    const bbi = textOf(checklistFor({ nationality: "JP", arrivalAirport: "BBI" }));
    assert.match(bbi, /e-Visa/);
    assert.match(bbi, /Bhubaneswar \(BBI\) has no visa on arrival/);
    const del = textOf(checklistFor({ nationality: "JP", arrivalAirport: "DEL" }));
    assert.match(del, /Visa on arrival/);
    assert.doesNotMatch(del, /Bhubaneswar/);
    assert.doesNotMatch(del, /at least 4 days/);
  });

  it("keeps UAE on an e-Visa unless a prior visa and a visa-on-arrival airport are both true", () => {
    const without = textOf(checklistFor({ nationality: "AE", arrivalAirport: "DEL" }));
    assert.match(without, /e-Visa/);
    assert.doesNotMatch(without, /only because a previous Indian/);
    const withPrior = textOf(checklistFor({ nationality: "AE", arrivalAirport: "DEL", priorIndianVisa: true }));
    assert.match(withPrior, /Visa on arrival/);
  });

  it("covers Pakistan, Nepal and China", () => {
    assert.match(textOf(checklistFor({ nationality: "PK" })), /regular visa at an Indian mission/);
    assert.match(textOf(checklistFor({ nationality: "NP" })), /do not need a visa/);
    const nepal = checklistFor({ nationality: "NP" });
    assert.equal(nepal.find((item) => item.id.startsWith("earrival"))?.severity, "check");
    assert.match(textOf(checklistFor({ nationality: "CN" })), /Not on the e-Visa eligibility list/);
  });

  it("keeps the e-Visa set at the 174 codes checked on 19 Oct 2026", () => {
    assert.equal(EVISA_CODES.length, 174);
    assert.equal(new Set(EVISA_CODES).size, 174);
    for (const code of ["NP", "BT", "MV", "CN", "PK", "HK", "MO", "IN"]) {
      assert.equal(EVISA_CODES.includes(code), false);
    }
  });

  it("gives every item a source and fails after the review date", () => {
    assert.equal(REVIEW_BY, plusDays(RULES_RETRIEVED_AT, 90));
    assert.equal(REVIEW_BY, "2027-01-17");
    const today = new Date().toISOString().slice(0, 10);
    assert.ok(today <= REVIEW_BY, `arrival rules need review after ${REVIEW_BY}`);
    const samples = ["IN", "GB", "JP", "KR", "AE", "NP", "BT", "MV", "PK", "CN", "HK", "US", ...EVISA_CODES.slice(0, 20)];
    for (const nationality of samples) {
      for (const arrivalAirport of ["BBI", "DEL", "COK"]) {
        for (const priorIndianVisa of [false, true]) {
          for (const oci of [false, true]) {
            for (const item of checklistFor({ nationality, arrivalAirport, priorIndianVisa, oci })) {
              assert.ok(item.sourceId, item.id);
              const source = SOURCES[item.sourceId];
              assert.ok(source.url);
              assert.equal(source.retrievedAt, "2026-10-19");
            }
          }
        }
      }
    }
  });

  it("renders an ASCII checklist with source URLs", () => {
    const items = checklistFor({ nationality: "GB" });
    const text = renderChecklistText(items);
    assert.match(text, /https:\/\/indianvisaonline\.gov\.in\/evisa\//);
    assert.match(text, /https:\/\/indianvisaonline\.gov\.in\/earrival\//);
    assert.match(text, /Rules checked 19 Oct 2026/);
    assert.equal(text.includes("\u2014"), false);
    assert.match(text, /^[\t\n\r\x20-\x7E]*$/);
    const mail = paidAbroadLines({ guestNationalities: ["GB"], confirmationCode: "TW-1" });
    assert.match(mail.join("\n"), /e-Arrival card \(within 72 h/);
    assert.match(mail.join("\n"), /\/voucher\/TW-1/);
    assert.equal(paidAbroadLines({ guestNationalities: ["IN"], confirmationCode: "TW-1" }).length, 0);
  });

  it("keeps only e-Arrival and Air Suvidha for an OCI cardholder", () => {
    const items = checklistFor({ nationality: "GB", oci: true });
    assert.deepEqual(items.map((item) => item.id), ["earrival", "airsuvidha"]);
  });
});
