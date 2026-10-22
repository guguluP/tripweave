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
    assert.match(raw, /Content-Type: text\/plain; charset=UTF-8/);
    assert.match(raw, /Content-Transfer-Encoding: 8bit/);
    assert.match(raw, /Subject: Reset\r\n/);
  });

  it("encodes a non-ASCII subject and leaves ASCII subjects plain", () => {
    const raw = smtpData("desk@gmail.com", {
      to: "guest@example.com",
      subject: "Stay confirmed \u2014 TW-1",
      text: "Hello",
    });
    assert.match(raw, /Subject: =\?UTF-8\?B\?/);
    assert.doesNotMatch(raw, /Subject: Stay confirmed \u2014/);
    assert.match(raw, /Content-Type: text\/plain; charset=UTF-8/);
  });

  it("sends multipart when html is provided", () => {
    const raw = smtpData("desk@gmail.com", {
      to: "guest@example.com",
      subject: "Reset",
      text: "Reset your password:\nhttps://example.com/reset",
      html: "<p>Reset your password.</p><p><a href=\"https://example.com/reset\">Choose a new password</a></p>",
    });
    assert.match(raw, /multipart\/alternative/);
    assert.match(raw, /Content-Type: text\/html; charset=UTF-8/);
    assert.match(raw, /Choose a new password/);
    assert.match(raw, /Reset your password:/);
  });
});
