import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { withCancelLock } from "./cancel-lock.ts";

const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

test("cancels for the same stay run one after another", async () => {
  const order: string[] = [];
  let open = true;
  let refunds = 0;
  const cancel = (label: string) =>
    withCancelLock("u1:7", async () => {
      order.push(`${label}:start`);
      const wasOpen = open;
      await tick();
      if (wasOpen) {
        refunds += 1;
        open = false;
      }
      order.push(`${label}:end`);
      return wasOpen;
    });
  const results = await Promise.all([cancel("a"), cancel("b"), cancel("c")]);
  assert.deepEqual(results, [true, false, false]);
  assert.equal(refunds, 1);
  assert.deepEqual(order, ["a:start", "a:end", "b:start", "b:end", "c:start", "c:end"]);
});

test("different stays do not wait for each other", async () => {
  const order: string[] = [];
  await Promise.all([
    withCancelLock("u1:1", async () => {
      order.push("1:start");
      await tick();
      order.push("1:end");
    }),
    withCancelLock("u1:2", async () => {
      order.push("2:start");
      await tick();
      order.push("2:end");
    }),
  ]);
  assert.deepEqual(order.slice(0, 2), ["1:start", "2:start"]);
});

test("a failed cancel does not block the next one", async () => {
  await assert.rejects(
    withCancelLock("u1:9", async () => Promise.reject(new Error("gateway down"))),
  );
  assert.equal(await withCancelLock("u1:9", async () => "retried"), "retried");
});

const bookings = readFileSync(new URL("./bookings.ts", import.meta.url), "utf8");
const cancelSrc = bookings.slice(
  bookings.indexOf("export const cancelBooking = "),
  bookings.indexOf("export { methodLabel }"),
);

test("cancelBooking runs under the per-stay lock", () => {
  assert.match(bookings, /withCancelLock\(`\$\{context\.userId\}:\$\{id\}`/);
});

test("Postgres cancel also closes refund_pending stays and checks a row changed", () => {
  // Before: refund_pending was open to cancel, the refund went out, but the update skipped the row.
  assert.match(
    cancelSrc,
    /status in \('paid', 'held', 'confirmed', 'refund_pending'\)\s+returning id/,
  );
  assert.match(cancelSrc, /if \(fromSql && !updated\.length\) statusSaved = false;/);
});
