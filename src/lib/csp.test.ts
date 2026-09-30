import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContentSecurityPolicy, cspAllowsHost } from "./csp.ts";

describe("buildContentSecurityPolicy", () => {
  it("allowlists Razorpay and Google script hosts", () => {
    const policy = buildContentSecurityPolicy();
    assert.ok(cspAllowsHost(policy, "https://checkout.razorpay.com"));
    assert.ok(cspAllowsHost(policy, "https://accounts.google.com"));
    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /object-src 'none'/);
    assert.ok(cspAllowsHost(policy, "https://www.mappls.com"));
    assert.ok(cspAllowsHost(policy, "https://apis.mappls.com"));
  });

  it("keeps frame-ancestors self", () => {
    const policy = buildContentSecurityPolicy({ allowUnsafeEval: true });
    assert.match(policy, /frame-ancestors 'self'/);
    assert.match(policy, /'unsafe-eval'/);
  });
});
