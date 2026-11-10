import assert from "node:assert/strict";
import { test } from "node:test";
import { vercelTrustedOrigins } from "./trusted-origins.ts";

test("trusted origins never include a vercel.app wildcard", () => {
  const list = vercelTrustedOrigins({});
  assert.ok(list.every((origin) => !origin.includes("*")));
  assert.ok(list.includes("https://tripweave-web.vercel.app"));
});

test("a deployment trusts its own URLs only", () => {
  const list = vercelTrustedOrigins({
    VERCEL_URL: "tripweave-abc123-piyushpatnaik.vercel.app",
    VERCEL_BRANCH_URL: "https://tripweave-web-git-fix-piyushpatnaik.vercel.app/",
    VERCEL_PROJECT_PRODUCTION_URL: "tripweave-web.vercel.app",
  });
  assert.ok(list.includes("https://tripweave-abc123-piyushpatnaik.vercel.app"));
  assert.ok(list.includes("https://tripweave-web-git-fix-piyushpatnaik.vercel.app"));
  assert.equal(list.filter((origin) => origin === "https://tripweave-web.vercel.app").length, 1);
  assert.equal(list.some((origin) => origin.includes("attacker")), false);
});

test("junk env values are ignored", () => {
  const list = vercelTrustedOrigins({ VERCEL_URL: "evil.com/*", VERCEL_BRANCH_URL: "*.vercel.app" });
  assert.deepEqual(list, ["https://tripweave-web.vercel.app", "https://tripweave-web-piyushpatnaik.vercel.app"]);
});
