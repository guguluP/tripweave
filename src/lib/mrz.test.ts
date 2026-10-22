import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { icaoNationality, mrzToTraveler } from "./mrz.ts";

const UTOPIA = [
  "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
  "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
];

describe("mrz", () => {
  it("parses the ICAO UTOPIA TD3 specimen down to the last 4", () => {
    const fill = mrzToTraveler(UTOPIA, { arrivalDate: "2026-11-01" });
    assert.ok(fill);
    assert.equal(fill!.fullName, "Eriksson Anna Maria");
    assert.equal(fill!.idType, "passport");
    assert.ok(fill!.idNumber.length <= 4);
    assert.equal(fill!.idNumber, "9023");
    assert.equal(fill!.nationality, undefined);
    assert.equal(JSON.stringify(fill).includes("L898902C3"), false);
    assert.match(fill!.expiryWarning ?? "", /6 months/);
    assert.equal(icaoNationality("GBR"), "GB");
    assert.equal(icaoNationality("D"), "DE");
    assert.equal(icaoNationality("XXA"), null);
  });

  it("warns on a bad check digit and does not keep the number", () => {
    const fill = mrzToTraveler([
      UTOPIA[0]!,
      "L898902C30UTO7408122F1204159ZE184226B<<<<<10",
    ]);
    assert.ok(fill);
    assert.equal(fill!.idNumber, "");
    assert.equal(fill!.checkDigitsOk, false);
    assert.ok(fill!.warnings.some((warning) => /check digit/i.test(warning)));
    assert.equal(JSON.stringify(fill).includes("L898902C3"), false);
  });
});
