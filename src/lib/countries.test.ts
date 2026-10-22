import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALPHA3_TO_ALPHA2, COUNTRY_CODES, countryName, isCountryCode } from "./countries.ts";

describe("countries", () => {
  it("ships 250 unique alpha-2 codes", () => {
    assert.equal(COUNTRY_CODES.length, 250);
    assert.equal(new Set(COUNTRY_CODES).size, 250);
    for (const code of COUNTRY_CODES) assert.match(code, /^[A-Z]{2}$/);
    assert.equal(isCountryCode("IN"), true);
    assert.equal(isCountryCode("GB"), true);
    assert.equal(isCountryCode("US"), true);
    assert.equal(isCountryCode("UK"), false);
  });

  it("names Germany in English and maps GBR", () => {
    assert.equal(countryName("DE", "en"), "Germany");
    assert.equal(ALPHA3_TO_ALPHA2.GBR, "GB");
  });
});
