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

  it("uses OSRTC into Puri Bus Stand from Bhubaneswar", () => {
    const origin = getOrigin("bhubaneswar");
    assert.ok(arriveOptionsFor("bhubaneswar").includes("bus"));
    assert.equal(origin.defaultArriveBy, "bus");
    const inbound = inboundFor("bhubaneswar", "bus");
    assert.equal(inbound.gateway, "BUS");
    assert.match(inbound.label, /OSRTC|Baramunda/);
    const j = getJourney("taj-puri-resort-spa", "bhubaneswar", "bus");
    assert.equal(j.showBusGuide, true);
    assert.match(j.lastMile.mode, /Ama Bus|Bus Stand|auto/i);
  });

  it("maps Ama Bus for temple-side stays from the bus stand", () => {
    const last = lastMileForArrival("chanakya-bnr-puri", "bus");
    assert.match(last.mode.toLowerCase(), /walk|auto/);
    const far = lastMileForArrival("toshali-sands-puri", "bus");
    assert.match(far.mode.toLowerCase(), /cab/);
  });
});
