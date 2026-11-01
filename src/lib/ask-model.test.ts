import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ASK_BOOKING_COLUMNS, askBookingColumnsAreNarrow } from "./ask-booking-columns.ts";
import { ASK_LIMIT, answerAsk, needsLocalConditions } from "./ask-model.ts";
import { groundingPacket } from "./arrival-ask.ts";
import { stayPin } from "./places.ts";

const stay = () =>
  groundingPacket({
    nationalities: ["IN"],
    packageId: "taj-puri-resort-spa",
    checkIn: "2027-06-15",
    nights: 2,
    arriveBy: "fly",
    amountInr: 10000,
    status: "paid",
  });

describe("ask booking columns", () => {
  it("reads one stay's necessary columns and no payment fields", () => {
    assert.equal(askBookingColumnsAreNarrow(), true);
    assert.equal(ASK_BOOKING_COLUMNS.includes("*"), false);
    assert.match(ASK_BOOKING_COLUMNS, /package_id/);
    assert.match(ASK_BOOKING_COLUMNS, /amount_inr/);
    assert.equal(ASK_BOOKING_COLUMNS.includes("card_last4"), false);
    assert.equal(ASK_BOOKING_COLUMNS.includes("payment_ref"), false);
    assert.equal(ASK_BOOKING_COLUMNS.includes("upi_handle"), false);
    assert.equal(ASK_BOOKING_COLUMNS.includes("payer_name"), false);
  });
});

describe("answerAsk", () => {
  it("quotes the packet refund and no other rupee amount", () => {
    const answer = answerAsk("What is the refund if I cancel?", stay()).text;
    assert.match(answer, /TripWeave refund/);
    assert.match(answer, /₹10000/);
    assert.equal(answer.replace("₹10000", "").includes("₹"), false);
    assert.equal(needsLocalConditions("What is the refund if I cancel?"), false);
  });

  it("answers what is nearby from the walk estimate", () => {
    const packet = groundingPacket({ nationalities: ["IN"], packageId: "chariot-resort-puri", roomId: "deluxe" });
    const from = stayPin("chariot-resort-puri", "The Chariot");
    const reply = answerAsk("what nearby of this hotel", packet, "en", { from });
    assert.match(reply.text, /straight-line/);
    assert.match(reply.text, /Jagannath Temple/);
    assert.match(reply.text, /km| m,/);
    assert.equal(reply.text.includes("Deluxe"), false);
    assert.ok(reply.markers.length >= 2);
  });

  it("keeps an official URL on a visa question", () => {
    const packet = groundingPacket({ nationalities: ["GB"], arrivalAirport: "BBI" });
    const answer = answerAsk("Do I need a visa?", packet).text;
    assert.match(answer, /https:\/\/indianvisaonline\.gov\.in/);
  });

  it("names the stay when the question asks which hotel", () => {
    const answer = answerAsk("Which hotel is this?", stay()).text;
    assert.match(answer, /Taj Puri Resort & Spa/);
    assert.equal(answer.includes("http"), false);
  });

  it("does not paste a visa line when nothing matches", () => {
    const answer = answerAsk("What is the capital of France?", stay()).text;
    assert.equal(answer, ASK_LIMIT);
    assert.equal(answer.includes("http"), false);
  });

  it("uses a fixture bulletin for weather and leaves the refund out", () => {
    const answer = answerAsk("What is the weather in Puri today?", stay(), "en", {
      bulletin: {
        ok: true,
        observed: "Observed on Nov 01, 2026: max 33.6°C, min 25.4°C.",
        today: "01-Nov, 25.0 to 32.0°C, partly cloudy.",
        warning: "Thunderstorm accompanied with lightning.",
      },
    }).text;
    assert.match(answer, /33\.6°C/);
    assert.match(answer, /Thunderstorm/);
    assert.match(answer, /city\.imd\.gov\.in/);
    assert.equal(answer.includes("refund"), false);
    assert.equal(needsLocalConditions("What is the weather in Puri today?"), true);
  });

  it("says the forecast could not be checked when the bulletin failed", () => {
    const answer = answerAsk("Any warning in Puri?", stay(), "en", { bulletin: { ok: false } }).text;
    assert.match(answer, /could not be checked/);
    assert.match(answer, /city\.imd\.gov\.in/);
  });

  it("gives Konark a straight-line distance and a map from the hotel", () => {
    const from = stayPin("taj-puri-resort-spa", "Taj Puri");
    const reply = answerAsk("How far is Konark, and what can I see?", stay(), "en", { from });
    assert.match(reply.text, /Konark Sun Temple/);
    assert.match(reply.text, /straight-line/);
    assert.match(reply.text, /mappls\.com\/direction/);
    assert.ok(reply.markers.some((pin) => pin.label === "Konark Sun Temple"));
    assert.ok(reply.markers.some((pin) => pin.label === "Taj Puri"));
    const km = Number(reply.text.match(/Konark Sun Temple is (\d+) km/)?.[1]);
    assert.ok(km >= 30 && km <= 45);
  });

  it("lists places to visit with distances", () => {
    const from = stayPin("taj-puri-resort-spa", "Taj Puri");
    const reply = answerAsk("What places should I visit?", stay(), "en", { from });
    assert.match(reply.text, /Puri sea beach/);
    assert.match(reply.text, /Gundicha Temple/);
    assert.match(reply.text, /Konark Sun Temple/);
    assert.ok(reply.markers.length >= 4);
  });

  it("answers Rath Yatra from the exported dates", () => {
    const answer = answerAsk("When is Rath Yatra?", stay()).text;
    assert.match(answer, /2026-06-26 through 2026-07-06/);
  });
});
