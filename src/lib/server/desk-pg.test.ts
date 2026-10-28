import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const deskPg = readFileSync(new URL("./desk-pg.ts", import.meta.url), "utf8");
const deskOps = readFileSync(new URL("./desk-ops.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../../migrations/0007_partner_desk_ops.sql", import.meta.url), "utf8");

function transitionFn(): string {
  const start = migration.indexOf("create or replace function tw_desk_transition(p_payload jsonb)");
  const end = migration.indexOf("$$;", migration.indexOf("as $$", start)) + 3;
  assert.ok(start >= 0 && end > start);
  return migration.slice(start, end);
}

async function deskDb() {
  const db = new PGlite();
  await db.exec(`
    create table bookings (
      id bigint primary key, user_id text, package_id text, package_name text, nights int, travelers int,
      check_in date, amount_inr int, swaps text not null default '{}', status text, payer_name text,
      confirmation_code text, payment_method text, payment_ref text, created_at timestamptz default now(),
      desk_confirmed_at timestamptz, desk_declined_at timestamptz, checked_in_at timestamptz, ops_flagged_at timestamptz
    );
  `);
  await db.exec(transitionFn());
  return db;
}

test("Postgres desk list: the property's open stays, newest first, nothing from other hotels or closed stays", async () => {
  const db = await deskDb();
  const add = (id: number, pkg: string, status: string, ago: number) =>
    db.query(
      `insert into bookings (id, user_id, package_id, package_name, nights, travelers, check_in, amount_inr, status,
         payer_name, confirmation_code, payment_method, payment_ref, created_at)
       values ($1::bigint, 'u1', $2, 'Taj', 1, 2, '2099-01-01', 5000, $3, 'A', 'TW-' || $1::text, 'razorpay', 'pay_' || $1::text,
         now() - make_interval(mins => $4::int))`,
      [id, pkg, status, ago],
    );
  await add(1, "taj", "paid", 30);
  await add(2, "taj", "desk_confirmed", 10);
  await add(3, "taj", "cancelled", 5);
  await add(4, "other", "paid", 1);
  await add(5, "taj", "checked_in", 20);
  await add(6, "taj", "refunded", 2);
  // The same filter and order as pgDeskBookings.
  assert.match(deskPg, /status in \('paid', 'confirmed', 'desk_confirmed', 'checked_in', 'held'\)\s+order by created_at desc/);
  const rows = await db.query<{ id: number }>(
    `select id from bookings where package_id = 'taj'
       and status in ('paid', 'confirmed', 'desk_confirmed', 'checked_in', 'held') order by created_at desc`,
  );
  assert.deepEqual(rows.rows.map((r) => Number(r.id)), [2, 5, 1]);
  await db.close();
});

test("Postgres desk decline: two declines at once, only one gets the cancelled row (one refund)", async () => {
  const db = await deskDb();
  await db.query(
    `insert into bookings (id, user_id, package_id, package_name, nights, travelers, check_in, amount_inr, status,
       confirmation_code, payment_method, payment_ref) values (7, 'u1', 'taj', 'Taj', 1, 2, '2099-01-01', 5000, 'paid', 'TW-7', 'razorpay', 'pay_7')`,
  );
  const decline = () =>
    db
      .query<{ r: { status: string } }>(`select tw_desk_transition($1::jsonb) as r`, [
        JSON.stringify({ id: 7, package_id: "taj", action: "desk_decline" }),
      ])
      .then((res) => res.rows[0].r.status)
      .catch((err: Error) => err.message);
  const results = await Promise.all([decline(), decline()]);
  assert.equal(results.filter((r) => r === "cancelled").length, 1, JSON.stringify(results));
  assert.ok(results.some((r) => /not_open/.test(r)));
  await db.close();
});

test("runTransition on Postgres refunds a declined stay and the desk list reads Postgres", () => {
  const pgBranch = deskOps.slice(deskOps.indexOf("select tw_desk_transition("));
  assert.match(pgBranch, /input\.action === "desk_decline" && result\?\.status === "cancelled"/);
  assert.match(pgBranch, /pgRefundDeclinedStay\(input\)/);
  const list = deskOps.slice(deskOps.indexOf("export const deskListBookings"), deskOps.indexOf("export const deskForeignRegister"));
  assert.match(list, /pgDeskBookings\(data\.packageId\)/);
});

test("pgRefundDeclinedStay: full refund once, then refunded; gateway failure leaves refund_pending", () => {
  const fn = deskPg.slice(deskPg.indexOf("export async function pgRefundDeclinedStay"));
  assert.match(fn, /row\.status !== "cancelled"/, "only a row the decline just cancelled");
  assert.match(fn, /amountRefundedPaise/, "checks what was already refunded");
  assert.match(fn, /refundRazorpayPayment\(ref, amountInr\)/);
  assert.match(fn, /set status = 'refund_pending'\s+where id = \$\{input\.id\} and package_id = \$\{input\.packageId\} and status = 'cancelled'/);
  assert.match(fn, /set status = 'refunded', swaps = /);
  assert.ok(fn.indexOf('status: "pending"') < fn.indexOf("refundRazorpayPayment("), "refund intent saved before the gateway");
});

test("refund resume writes the refunded status on Postgres too (desk decline that hit a gateway error)", () => {
  const resume = readFileSync(new URL("./refund-resume.ts", import.meta.url), "utf8");
  assert.match(resume, /else if \(!shouldSkipNeon\(\)\)[\s\S]*update bookings set status = 'refunded'[\s\S]*status in \('refund_pending'/);
  assert.match(resume, /if \(!updated\.length\) statusSaved = false;/, "intent stays open when no row changed");
  const bookings = readFileSync(new URL("./bookings.ts", import.meta.url), "utf8");
  assert.match(bookings, /resumePendingRefundsForUser\(userId, rows\)/, "one shared resume, not a second copy");
  const cron = readFileSync(new URL("./refund-cron.ts", import.meta.url), "utf8");
  assert.match(cron, /pgBookingsFor\(userId\)/, "cron reads Postgres stays");
});
