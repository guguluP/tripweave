import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { acceptGroundedReply, fallbackAnswer, groundingPacket, questionHasDocumentDigits } from "./arrival-ask.ts";

describe("document digits", () => {
  it("rejects spaced and punctuated numbers", () => {
    assert.equal(questionHasDocumentDigits("1234567890"), true);
    assert.equal(questionHasDocumentDigits("passport 1 2 3 4 5 6 7 8"), true);
    assert.equal(questionHasDocumentDigits("1-2-3-4-5-6"), true);
    assert.equal(questionHasDocumentDigits("what is an e-visa"), false);
  });
});

describe("arrival ask grounding", () => {
  it("builds a packet from the checklist and only those URLs", () => {
    const packet = groundingPacket({ nationalities: ["GB"], arrivalAirport: "BBI" });
    assert.match(packet.text, /e-Visa/);
    assert.ok(packet.urls.every((url) => url.startsWith("https://")));
    assert.equal(packet.text.includes("passport number"), false);
  });

  it("drops a reply that cites a site outside the packet", () => {
    const urls = ["https://indianvisaonline.gov.in/evisa/"];
    const rejected = acceptGroundedReply(`See https://example.com/visa and ${urls[0]}`, urls);
    assert.equal(rejected, fallbackAnswer(urls));
  });

  it("keeps a reply that cites only a packet URL", () => {
    const urls = ["https://indianvisaonline.gov.in/evisa/"];
    const kept = acceptGroundedReply(`Apply on ${urls[0]} at least 4 days ahead.`, urls);
    assert.match(kept, /evisa/);
  });

  it("uses the fallback when the model cites nothing", () => {
    const urls = ["https://indianvisaonline.gov.in/earrival/"];
    assert.equal(acceptGroundedReply("Yes, you are fine.", urls), fallbackAnswer(urls));
  });
});
