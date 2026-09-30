import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { getPackage } from "./packages.ts";
import { quoteStay, tryReserveHold, releaseHoldById } from "./inventory.ts";
import { setNightUnits, setStopSell, replaceAllotment, replaceStopSell } from "./allotment-store.ts";
import { packageIdsForPartner } from "./partner-access.ts";
import { parseDeskTokens, signDeskAction, verifyDeskAction } from "./server/desk-auth.ts";
import { nextStatus } from "./booking-status.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

async function boot() {
  const pg = new PGlite();
  await pg.waitReady;
  for (const name of ["0002_bookings.sql", "0007_partner_desk_ops.sql"]) {
    await pg.exec(readFileSync(join(root, "migrations", name), "utf8"));
  }
  return pg;
}

async function call(pg: PGlite, fn: string, payload: unknown) {
  const res = await pg.query<{ result: unknown }>(`select ${fn}($1::jsonb) as result`, [
    JSON.stringify(payload),
  ]);
  const value = res.rows[0]?.result;
  return typeof value === "string" ? JSON.parse(value) : value;
}

describe("partner desk ops", () => {
  it("blocks checkout quote when stop-sell is set", () => {
    replaceStopSell([]);
    replaceAllotment([]);
    const pkg = getPackage("taj-puri-resort-spa")!;
    const roomId = pkg.rooms[0]!.id;
    const night = "2026-09-15";
    setNightUnits({ packageId: pkg.id, roomId, night, units: 4 });
    const before = quoteStay({ packageId: pkg.id, roomId, checkIn: night, nights: 1 });
    assert.ok(before?.available);
    setStopSell({ packageId: pkg.id, roomId: "", night, reason: "maintenance" }, true);
    const after = quoteStay({ packageId: pkg.id, roomId, checkIn: night, nights: 1 });
    assert.ok(after);
    assert.equal(after!.available, false);
    assert.ok(after!.soldOutNights.includes(night));
    assert.equal(
      tryReserveHold({
        holdId: "stop-sell-test",
        packageId: pkg.id,
        roomId,
        checkIn: night,
        nights: 1,
        status: "held",
      }),
      false,
    );
    setStopSell({ packageId: pkg.id, roomId: "", night }, false);
  });

  it("honours per-night unit allotment of zero", () => {
    replaceStopSell([]);
    replaceAllotment([]);
    const pkg = getPackage("taj-puri-resort-spa")!;
    const roomId = pkg.rooms[0]!.id;
    const night = "2026-09-16";
    setNightUnits({ packageId: pkg.id, roomId, night, units: 0 });
    const q = quoteStay({ packageId: pkg.id, roomId, checkIn: night, nights: 1 });
    assert.ok(q);
    assert.equal(q!.available, false);
    assert.equal(q!.units, 0);
    replaceAllotment([]);
  });

  it("refuses PARTNER_EMAILS email:* wildcard", () => {
    const prev = process.env.PARTNER_EMAILS;
    process.env.PARTNER_EMAILS = "ops@example.com:*";
    assert.deepEqual(packageIdsForPartner("ops@example.com"), []);
    process.env.PARTNER_EMAILS = "ops@example.com:taj-puri-resort-spa";
    assert.deepEqual(packageIdsForPartner("ops@example.com"), ["taj-puri-resort-spa"]);
    if (prev === undefined) delete process.env.PARTNER_EMAILS;
    else process.env.PARTNER_EMAILS = prev;
  });

  it("signs and verifies desk accept links", () => {
    const prev = process.env.TW_DESK_SECRET;
    process.env.TW_DESK_SECRET = "test-desk-secret-for-unit-tests";
    const token = signDeskAction({
      bookingId: 42,
      packageId: "taj-puri-resort-spa",
      confirmationCode: "TW-TEST",
      action: "accept",
    });
    assert.ok(token);
    const payload = verifyDeskAction(token!);
    assert.ok(payload);
    assert.equal(payload!.bookingId, 42);
    assert.equal(payload!.action, "accept");
    assert.equal(verifyDeskAction("tampered." + token!.split(".")[1]), null);
    if (prev === undefined) delete process.env.TW_DESK_SECRET;
    else process.env.TW_DESK_SECRET = prev;
  });

  it("parses TW_DESK_TOKENS per property", () => {
    const grants = parseDeskTokens("taj-puri-resort-spa:secret-a,mayfair-heritage-puri:secret-b");
    assert.equal(grants.length, 2);
    assert.equal(grants[0]?.packageId, "taj-puri-resort-spa");
  });

  it("SQL: allotment, stop-sell, and desk_confirmed transition", async () => {
    const pg = await boot();
    await call(pg, "tw_set_allotment", {
      package_id: "taj",
      room_id: "superior",
      night: "2026-09-20",
      units: 3,
    });
    const units = await pg.query<{ u: number }>(
      "select tw_night_units($1::jsonb)::int as u",
      [JSON.stringify({ package_id: "taj", room_id: "superior", night: "2026-09-20", fallback: 4 })],
    );
    assert.equal(Number(units.rows[0]?.u), 3);

    await call(pg, "tw_set_stop_sell", {
      package_id: "taj",
      room_id: "",
      night: "2026-09-21",
      closed: true,
    });
    const closed = await pg.query<{ c: boolean }>(
      "select tw_is_stop_sell($1::jsonb) as c",
      [JSON.stringify({ package_id: "taj", room_id: "superior", night: "2026-09-21" })],
    );
    assert.equal(closed.rows[0]?.c, true);

    await pg.query(
      `insert into bookings (
        user_id, package_id, package_name, nights, travelers, check_in,
        amount_inr, swaps, status, payer_name, confirmation_code
      ) values (
        'u1', 'taj', 'Taj', 1, 2, '2026-09-22',
        1000, '{}', 'paid', 'Guest', 'TW-DESK-1'
      )`,
    );
    const idRes = await pg.query<{ id: number }>("select id from bookings where confirmation_code = 'TW-DESK-1'");
    const id = Number(idRes.rows[0]?.id);
    const confirmed = await call(pg, "tw_desk_transition", {
      id,
      package_id: "taj",
      action: "desk_confirm",
    });
    assert.equal(confirmed.status, "desk_confirmed");
    assert.equal(nextStatus("paid", "desk_confirm"), "desk_confirmed");

    await assert.rejects(
      () => call(pg, "tw_desk_transition", { id, package_id: "taj", action: "desk_confirm" }),
      (err: unknown) => /not_open/.test(message(err)),
    );

    const checked = await call(pg, "tw_desk_transition", {
      id,
      package_id: "taj",
      action: "check_in",
    });
    assert.equal(checked.status, "checked_in");

    // Flag unconfirmed: insert an old paid row
    await pg.query(
      `insert into bookings (
        user_id, package_id, package_name, nights, travelers, check_in,
        amount_inr, swaps, status, payer_name, confirmation_code, created_at
      ) values (
        'u2', 'taj', 'Taj', 1, 2, '2026-09-23',
        1000, '{}', 'paid', 'Late', 'TW-FLAG-1', now() - interval '40 minutes'
      )`,
    );
    const flagged = await call(pg, "tw_flag_unconfirmed", { minutes: 20 });
    assert.ok(Number(flagged.flagged) >= 1);

    releaseHoldById("stop-sell-test");
  });
});
