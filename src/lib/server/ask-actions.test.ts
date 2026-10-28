import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./ask-actions.ts", import.meta.url), "utf8");

test("car limit copy does not claim a request reached the desk", () => {
  // Failed desk mails also use a slot, so "already requested" can be false.
  assert.equal(/already requested today/.test(source), false);
  assert.match(source, /car requests for this stay are used up\. Contact the hotel desk directly: \$\{desk\.email\}/);
  assert.ok(source.indexOf("const desk = deskFor") < source.indexOf('takeAskSlot(context.userId, "car"'));
});
