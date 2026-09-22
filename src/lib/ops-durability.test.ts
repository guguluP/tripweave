import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

async function boot() {
  const pg = new PGlite();
  await pg.waitReady;
  for (const name of ["0002_bookings.sql", "0003_payments.sql", "0005_payment_ops.sql"]) {
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

function hold(id: string, room = "superior", units = 1) {
  return {
    hold_id: id,
    user_id: "user-a",
    package_id: "taj",
    room_id: room,
    check_in: "2026-08-12",
    nights: 1,
    units,
    expires_at: "2099-01-01T00:00:00.000Z",
  };
}

function booking(code: string, ref: string, except: string[]) {
  return {
    user_id: "user-a",
    package_id: "taj",
    package_name: "Taj",
    nights: 1,
    travelers: 2,
    check_in: "2026-08-12",
    amount_inr: 1000,
    swaps: { roomId: "superior" },
    status: "paid",
    card_last4: "4242",
    card_brand: "Visa",
    payer_name: "A",
    confirmation_code: code,
    payment_method: "razorpay",
    payment_ref: ref,
    room_id: "superior",
    units: 1,
    except_hold_ids: except,
  };
}

describe("durable holds and payment ops", () => {
  it("keeps two guests apart, survives a second query, and stores refunds", async () => {
    const pg = await boot();
    await call(pg, "tw_reserve_hold", hold("order_a"));
    await call(pg, "tw_reserve_hold", hold("order_a"));
    const same = await pg.query<{ n: number }>(
      "select count(*)::int as n from room_holds where hold_id = 'order_a'",
    );
    assert.equal(Number(same.rows[0]?.n), 1);

    await assert.rejects(
      () => call(pg, "tw_reserve_hold", hold("order_b")),
      (err: unknown) => /sold_out/.test(message(err)),
    );

    await call(pg, "tw_reserve_hold", hold("suite_1", "suite", 2));
    await call(pg, "tw_reserve_hold", hold("suite_2", "suite", 2));
    await assert.rejects(
      () => call(pg, "tw_reserve_hold", hold("suite_3", "suite", 2)),
      (err: unknown) => /sold_out/.test(message(err)),
    );

    const saved = await call(pg, "tw_reserve_booking", booking("TW-AAAAAA", "pay_a", ["order_a"]));
    assert.equal(saved.confirmation_code, "TW-AAAAAA");
    const holdRow = await pg.query<{ status: string }>(
      "select status from room_holds where hold_id = 'order_a'",
    );
    assert.equal(holdRow.rows[0]?.status, "converted");

    const again = await call(pg, "tw_reserve_booking", booking("TW-OTHER", "pay_a", []));
    assert.equal(again.confirmation_code, "TW-AAAAAA");
    const bookings = await pg.query<{ n: number }>("select count(*)::int as n from bookings");
    assert.equal(Number(bookings.rows[0]?.n), 1);

    await assert.rejects(
      () => call(pg, "tw_reserve_booking", booking("TW-BBBBBB", "pay_b", [])),
      (err: unknown) => /sold_out/.test(message(err)),
    );

    await call(pg, "tw_save_reconcile_job", {
      id: "rec_pay_z",
      user_id: "user-a",
      payment_id: "pay_z",
      order_id: "order_z",
      attempts: 1,
      last_error: "timeout",
      payload: { confirmationCode: "TW-AAAAAA" },
      state: "queued",
      created_at: "2026-09-22T00:00:00.000Z",
    });
    const listed = await call(pg, "tw_list_reconcile_jobs", { user_id: "user-a" });
    assert.equal(listed.length, 1);
    assert.equal(listed[0].payment_id, "pay_z");
    const other = await call(pg, "tw_list_reconcile_jobs", { user_id: "user-b" });
    assert.deepEqual(other, []);
    const stored = await pg.query<{ state: string }>(
      "select state from payment_reconcile_jobs where id = 'rec_pay_z'",
    );
    assert.equal(stored.rows[0]?.state, "queued");

    await call(pg, "tw_save_refund_intent", {
      id: "refund_user-a_1",
      user_id: "user-a",
      booking_id: 1,
      payment_ref: "pay_a",
      amount_inr: 800,
      status: "pending",
      created_at: "2026-09-22T00:00:00.000Z",
    });
    await call(pg, "tw_save_refund_intent", {
      id: "refund_user-a_1",
      user_id: "user-a",
      booking_id: 1,
      payment_ref: "pay_a",
      amount_inr: 800,
      status: "gateway_done",
      refund_id: "rfnd_1",
      created_at: "2026-09-22T00:00:00.000Z",
    });
    const intents = await pg.query<{ n: number; status: string }>(
      "select count(*)::int as n, max(status) as status from refund_intents",
    );
    assert.equal(Number(intents.rows[0]?.n), 1);
    assert.equal(intents.rows[0]?.status, "gateway_done");
  });
});
