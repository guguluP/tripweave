import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ASK_BODY_LIMIT, checkAskHeaders, readCappedText } from "./ask-request.ts";

const URL_ = "https://tripweave.example/api/ask";

function req(headers: Record<string, string>, body = "{}") {
  return new Request(URL_, { method: "POST", headers, body });
}

describe("ask request guards", () => {
  it("requires a JSON content type", () => {
    assert.equal(checkAskHeaders(req({ origin: "https://tripweave.example" }))?.status, 415);
    assert.equal(
      checkAskHeaders(req({ "content-type": "text/plain", origin: "https://tripweave.example" }))?.status,
      415,
    );
    assert.equal(
      checkAskHeaders(req({ "content-type": "application/json; charset=utf-8", origin: "https://tripweave.example" })),
      null,
    );
  });

  it("requires a same-origin Origin header", () => {
    assert.equal(checkAskHeaders(req({ "content-type": "application/json" }))?.status, 403);
    assert.equal(
      checkAskHeaders(req({ "content-type": "application/json", origin: "https://evil.example" }))?.status,
      403,
    );
    assert.equal(checkAskHeaders(req({ "content-type": "application/json", origin: "null" }))?.status, 403);
  });

  it("accepts the configured auth origin", () => {
    const before = process.env.BETTER_AUTH_URL;
    process.env.BETTER_AUTH_URL = "http://localhost:8080";
    try {
      assert.equal(checkAskHeaders(req({ "content-type": "application/json", origin: "http://localhost:8080" })), null);
    } finally {
      if (before === undefined) delete process.env.BETTER_AUTH_URL;
      else process.env.BETTER_AUTH_URL = before;
    }
  });

  it("rejects a declared body over the cap before reading it", () => {
    const headers = {
      "content-type": "application/json",
      origin: "https://tripweave.example",
      "content-length": String(ASK_BODY_LIMIT + 1),
    };
    assert.equal(checkAskHeaders(new Request(URL_, { method: "POST", headers, body: "{}" }))?.status, 413);
  });

  it("stops reading a body past the cap even without content-length", async () => {
    assert.equal(await readCappedText(req({}, "x".repeat(ASK_BODY_LIMIT + 10))), null);
    assert.equal(await readCappedText(req({}, '{"question":"hi there"}')), '{"question":"hi there"}');
  });
});
