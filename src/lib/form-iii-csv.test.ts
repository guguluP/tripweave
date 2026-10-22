import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FORM_III_COLUMNS, formIiiCsv, formIiiFilename } from "./form-iii-csv.ts";

describe("form III csv", () => {
  it("writes a UTF-8 BOM, quotes cells, and neutralises formula characters", () => {
    const csv = formIiiCsv(
      [
        {
          fullName: "Sam Lee",
          nationality: "GB",
          phone: "+447911123456",
          email: "sam@example.com",
          idType: "passport",
          idLast4: "9023",
          checkIn: "2026-11-02",
          nights: 3,
          arrivedFrom: "London",
          arrivalTime: "14:30",
          purpose: "tourism",
          previousStay: "",
          nextDestination: "Delhi",
          confirmationCode: "TW-1",
        },
      ],
      { name: "Taj Puri", phone: "+916742300000" },
    );
    assert.equal(csv.charCodeAt(0), 0xfeff);
    assert.match(csv, /"Name of the premise"/);
    assert.equal(csv.split("\r\n")[0]?.split(",").length, FORM_III_COLUMNS.length);
    assert.match(csv, /"'\+447911123456"/);
    assert.match(csv, /"'\+916742300000"/);
    assert.match(csv, /Passport number \(from passport\)/);
    assert.match(csv, /"Visa\/OCI number"/);
    assert.match(csv, /"Visa type"/);
    const injected = formIiiCsv(
      [
        {
          fullName: "=cmd",
          nationality: "GB",
          phone: "+447911123456",
          email: "a@b.co",
          checkIn: "2026-11-02",
          nights: 1,
          confirmationCode: "TW-2",
        },
      ],
      { name: "Stay" },
    );
    assert.match(injected, /"'=cmd"/);
    assert.equal(formIiiFilename("Taj Puri", new Date("2026-11-02T00:00:00Z")), "form-iii-worksheet-taj-puri-2026-11-02.csv");
    assert.equal(csv.includes("Street"), false);
  });
});
