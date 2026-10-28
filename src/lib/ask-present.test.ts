import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { answerQuestion } from "./arrival-ask.ts";
import { OFFICIAL_URLS, presentAnswer, takeQuota } from "./ask-present.ts";

const EVISA = "https://indianvisaonline.gov.in/evisa/";

describe("presentAnswer", () => {
  it("lifts an official URL into a chip and leaves the sentence", () => {
    const view = presentAnswer(`Apply at least 4 days ahead. ${EVISA}`, [EVISA]);
    assert.equal(view.prose.includes("http"), false);
    assert.equal(view.chips[0]?.url, EVISA);
    assert.equal(view.chips[0]?.title, "India e-Visa");
    assert.equal(view.tripweave, false);
  });

  it("keeps a TripWeave fact with no chip", () => {
    const view = presentAnswer("TripWeave refund if cancelled now: ₹500.", [EVISA]);
    assert.equal(view.tripweave, true);
    assert.equal(view.chips.length, 0);
    assert.match(view.prose, /TripWeave/);
  });
});

describe("presentAnswer fallback text (D9)", () => {
  it("does not leave a dangling 'see' once the link is a chip", () => {
    const BOI = "https://boi.gov.in/boi/";
    const view = presentAnswer(`Not stated by the official sources TripWeave checked; see ${BOI}`, [BOI]);
    assert.equal(view.prose, "Not stated by the official sources TripWeave checked.");
    assert.equal(view.chips[0]?.url, BOI);
    assert.equal(/\bsee\b/.test(view.prose), false);
  });
  it("keeps one line per fact and drops the empty brackets", () => {
    const view = presentAnswer(`Line one. (${EVISA})\nLine two. (${EVISA})`, [EVISA]);
    assert.equal(view.prose, "Line one.\nLine two.");
    assert.equal(view.chips.length, 1);
  });
});

describe("presentAnswer with nested source URLs", () => {
  const TVOA = "https://indianvisaonline.gov.in/evisa/tvoa.html";
  it("removes the longer link whole and chips both sources", () => {
    const view = presentAnswer(`Apply online (${EVISA}). Read the FAQ (${TVOA}).`, [EVISA, TVOA]);
    assert.equal(view.prose.includes("tvoa"), false);
    assert.equal(view.prose.includes("http"), false);
    assert.equal(view.prose, "Apply online. Read the FAQ.");
    assert.deepEqual(
      view.chips.map((chip) => chip.url),
      [EVISA, TVOA],
    );
  });
  it("files a longer link under the most specific allowed source", () => {
    const view = presentAnswer(`FAQ: ${TVOA}`, [EVISA, TVOA]);
    assert.equal(view.chips.length, 1);
    assert.equal(view.chips[0]?.url, TVOA);
  });
});

describe("every cited URL becomes a chip", () => {
  const questions = [
    "I'm an OCI card holder, what do I need?",
    "Can I get a visa on arrival?",
    "Which airports accept e-Visa?",
    "Do I need e-Arrival?",
    "What should I do before I fly?",
  ];
  for (const nationalities of [[], ["GB"], ["JP"], ["IN"]]) {
    for (const question of questions) {
      it(`${nationalities.join(",") || "no nationality"}: ${question}`, () => {
        const { answer } = answerQuestion(question, { nationalities, arrivalAirport: "BBI", checkIn: "2027-01-10" });
        const view = presentAnswer(answer, OFFICIAL_URLS);
        assert.equal(/https?:|\.html|\(\s*\)/.test(view.prose), false, view.prose);
        if (/https?:\/\//.test(answer)) {
          assert.ok(view.chips.length > 0, answer);
          assert.equal(view.tripweave, false, "an official-source answer is not labelled as a booking fact");
        }
      });
    }
  }
  it("the live reply and the saved thread use the same allowed list", () => {
    const route = readFileSync(new URL("../routes/api/ask.ts", import.meta.url), "utf8");
    const sheet = readFileSync(new URL("../components/ask-tripweave.tsx", import.meta.url), "utf8");
    assert.match(route, /presentAnswer\(result\.answer, OFFICIAL_URLS\)/);
    assert.match(sheet, /presentAnswer\(row\.answer, OFFICIAL_URLS\)/);
  });
});

describe("takeQuota", () => {
  it("allows ten asks in an hour and blocks the eleventh", () => {
    const now = 1_000_000;
    let kept: number[] = [];
    for (let i = 0; i < 10; i++) {
      const next = takeQuota(kept, now + i, 10);
      assert.equal(next.ok, true);
      kept = next.kept;
    }
    const blocked = takeQuota(kept, now + 20, 10);
    assert.equal(blocked.ok, false);
    const later = takeQuota(kept, now + 60 * 60_000 + 5, 10);
    assert.equal(later.ok, true);
  });
});
