import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listPackages } from "./packages.ts";
import { compareByTrust } from "./trust-tiebreak.ts";

const stay = (id: string, trustScore: number, videos: number, priceFrom: number) =>
  ({ id, trustScore, priceFrom, videos: Array.from({ length: videos }) }) as never;

describe("compareByTrust (equal Trust Scores)", () => {
  it("orders by trust, then sources, then price, then id", () => {
    const list = [
      stay("d", 92, 2, 3000),
      stay("c", 92, 2, 3000),
      stay("b", 92, 2, 2000),
      stay("a", 92, 5, 9000),
      stay("z", 95, 0, 9999),
    ];
    const ids = [...list].sort(compareByTrust).map((s: { id: string }) => s.id);
    assert.deepEqual(ids, ["z", "a", "b", "c", "d"]);
  });

  it("does not depend on catalog order", () => {
    const pkgs = listPackages();
    const a = [...pkgs].sort(compareByTrust).map((p) => p.id);
    const b = [...pkgs].reverse().sort(compareByTrust).map((p) => p.id);
    assert.deepEqual(a, b);
  });

  it("never returns 0 for two different stays", () => {
    const pkgs = listPackages();
    for (const x of pkgs) for (const y of pkgs) if (x.id !== y.id) assert.notEqual(compareByTrust(x, y), 0);
  });
});
