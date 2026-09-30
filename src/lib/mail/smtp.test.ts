import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { smtpData } from "./smtp.ts";

describe("smtpData", () => {
  it("dot-stuffs a body line that starts with a period", () => {
    const raw = smtpData("desk@gmail.com", {
      to: "guest@example.com",
      subject: "Reset",
      text: ".hidden\nhttps://tripweave-web.vercel.app/login",
    });
    assert.match(raw, /From: desk@gmail.com/);
    assert.match(raw, /\r\n\.\.hidden/);
    assert.match(raw, /https:\/\/tripweave-web.vercel.app\/login/);
  });
});