import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PACKAGES } from "./packages.ts";
import { getJourney, getTransportForPackage, lastMileForArrival } from "./transport.ts";
import { arriveOptionsFor, getOrigin, inboundFor, ORIGINS } from "./origins.ts";

describe("travel connectivity", () => {
  it("covers every catalog stay with last-mile notes", () => {
    for (const pkg of PACKAGES) {
      const t = getTransportForPackage(pkg.id);
      assert.ok(t.fromAirport.length >= 1, pkg.id);
      assert.ok(t.fromStation.length >= 1, pkg.id);
      assert.ok(t.best.mode, pkg.id);
      assert.ok(t.neighborhood, pkg.id);
    }
  });

  it("maps Kolkata flyers through BBI then the hotel road", () => {
    const j = getJourney("taj-puri-resort-spa", "kolkata", "fly");
    assert.equal(j.inbound.gateway, "BBI");
    assert.match(j.inbound.label, /BBI|Bhubaneswar/);
    assert.equal(j.showDigiYatra, true);
    assert.ok(j.lastMile.duration);
  });

  it("maps train arrivals to the station last mile", () => {
    const j = getJourney("chanakya-bnr-puri", "kolkata", "train");
    assert.equal(j.inbound.gateway, "PURI");
    assert.equal(j.showDigiYatra, false);
    const last = lastMileForArrival("chanakya-bnr-puri", "train");
    assert.match(last.mode.toLowerCase(), /walk|auto/);
  });

  it("has an inbound option for every origin city", () => {
    for (const origin of ORIGINS) {
      assert.ok(origin.inbound.length >= 1, origin.id);
      const allowed = arriveOptionsFor(origin.id);
      assert.ok(allowed.includes(origin.defaultArriveBy), origin.id);
      const leg = inboundFor(origin.id, origin.defaultArriveBy);
      assert.equal(leg.mode, origin.defaultArriveBy);
    }
    assert.equal(getOrigin("nope").id, "other");
  });
});
