import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { haversineKm, stayWalkTimes, walkMinutesFromKm } from "./walk-estimate.ts";

describe("walk estimate", () => {
  it("haversine is ~0 for the same point", () => {
    assert.ok(haversineKm({ lat: 19.8, lng: 85.8 }, { lat: 19.8, lng: 85.8 }) < 0.001);
  });

  it("converts km to minutes at 5 km/h", () => {
    assert.equal(walkMinutesFromKm(5), 60);
    assert.equal(walkMinutesFromKm(0.1), 1);
  });

  it("returns temple and station walk minutes when stay coords exist", () => {
    const walks = stayWalkTimes("chanakya-bnr-puri", "Chanakya");
    assert.ok(walks);
    assert.ok(walks!.templeMinutes != null && walks!.templeMinutes > 0);
    assert.ok(walks!.stationMinutes != null && walks!.stationMinutes > 0);
    // Near-station hotel should be a short walk to the station.
    assert.ok(walks!.stationMinutes! < walks!.templeMinutes! + 30);
  });
});
