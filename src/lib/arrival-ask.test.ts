import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { acceptGroundedReply, fallbackAnswer, groundingPacket, questionHasDocumentDigits } from "./arrival-ask.ts";

describe("document digits", () => {
  it("rejects document-like numbers and keeps a dated question", () => {
    assert.equal(questionHasDocumentDigits("1234567890"), true);
    assert.equal(questionHasDocumentDigits("passport 1 2 3 4 5 6 7 8"), true);
    assert.equal(questionHasDocumentDigits("1-2-3-4-5-6"), true);
    assert.equal(questionHasDocumentDigits("1.2.3.4.5.6"), true);
    assert.equal(questionHasDocumentDigits("what is an e-visa"), false);
    assert.equal(questionHasDocumentDigits("arrive 2027-06-15 flight 12"), false);
    assert.equal(questionHasDocumentDigits("check in 2028-02-29"), false);
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

  it("keeps a TripWeave answer that does not cite a site", () => {
    const urls = ["https://indianvisaonline.gov.in/evisa/"];
    const kept = acceptGroundedReply("TripWeave: the hotel has not confirmed this stay yet.", urls);
    assert.match(kept, /has not confirmed/);
  });

  it("drops a TripWeave answer that cites another site", () => {
    const urls = ["https://indianvisaonline.gov.in/evisa/"];
    assert.equal(acceptGroundedReply("TripWeave fee is listed at https://example.com/fee", urls), fallbackAnswer(urls));
  });

  it("keeps a mixed answer that cites a packet URL", () => {
    const urls = ["https://indianvisaonline.gov.in/evisa/"];
    const kept = acceptGroundedReply(`TripWeave: full refund. See ${urls[0]}`, urls);
    assert.match(kept, /TripWeave/);
    assert.match(kept, /evisa/);
  });

  it("grounds a stay in the catalog, the refund rule, and the airport car", () => {
    const packet = groundingPacket({
      nationalities: ["IN"],
      packageId: "taj-puri-resort-spa",
      checkIn: "2027-06-15",
      nights: 2,
      arriveBy: "fly",
      amountInr: 10000,
      status: "paid",
    });
    assert.match(packet.text, /Taj Puri Resort & Spa/);
    assert.match(packet.text, /Full refund/);
    assert.match(packet.text, /₹10000/);
    assert.match(packet.text, /airport car both ways/);
    assert.match(packet.text, /has not confirmed/);
    assert.equal(packet.text.includes("passport number"), false);
    const other = groundingPacket({
      nationalities: ["IN"],
      packageId: "swosti-premium-beach-resort",
      arriveBy: "fly",
    });
    assert.match(other.text, /no TripWeave airport car/);
    assert.equal(groundingPacket({ nationalities: ["GB"], packageId: "not-a-stay" }).text.includes("TripWeave stay:"), false);
  });
});
