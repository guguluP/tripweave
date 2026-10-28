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
  const pgBranch = deskOps.slice(deskOps.indexOf("pgDeskTransition(payload)"));
  assert.match(pgBranch, /input\.action === "desk_decline" && result\.status === "cancelled"/);
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

test("Postgres desk transition: a guest cancel claim stops the desk (no second refund path)", async () => {
  const db = await deskDb();
  await db.query(
    `insert into bookings (id, user_id, package_id, package_name, nights, travelers, check_in, amount_inr, status,
       confirmation_code, payment_method, payment_ref, swaps) values (8, 'u1', 'taj', 'Taj', 1, 2, '2099-01-01', 5000, 'paid', 'TW-8', 'razorpay', 'pay_8', '{}')`,
  );
  // The same guarded statement as pgDeskTransition.
  assert.match(deskPg, /with locked as \(\s*select id from bookings\s*where id = \$\{payload\.id\} and package_id = \$\{payload\.package_id\}\s*and swaps is not distinct from \$\{swapsText\}\s*for update\s*\)\s*select tw_desk_transition\(/);
  const guarded = (swapsRead: string) =>
    db.query<{ result: { status: string } }>(
      `with locked as (select id from bookings where id = 8 and package_id = 'taj' and swaps is not distinct from $1 for update)
       select tw_desk_transition($2::jsonb) as result from locked`,
      [swapsRead, JSON.stringify({ id: 8, package_id: "taj", action: "desk_decline" })],
    );
  // The guest claimed the stay after the desk read it: the swaps no longer match, nothing happens.
  await db.query(`update bookings set swaps = '{"__tw":"{\\"cancelClaimAt\\":\\"2099-01-01T00:00:00Z\\"}"}' where id = 8`);
  const blocked = await guarded("{}");
  assert.equal(blocked.rows.length, 0);
  assert.equal((await db.query<{ status: string }>(`select status from bookings where id = 8`)).rows[0].status, "paid");
  // Unchanged swaps: the desk decline goes through.
  const current = (await db.query<{ swaps: string }>(`select swaps from bookings where id = 8`)).rows[0].swaps;
  const ok = await guarded(current);
  assert.equal(ok.rows[0].result.status, "cancelled");
  // And the guest's claim (status must still be open) now fails.
  const claim = await db.query(
    `update bookings set swaps = '{}' where id = 8 and status in ('paid', 'held', 'confirmed', 'refund_pending') and swaps = $1 returning id`,
    [current],
  );
  assert.equal(claim.rows.length, 0);
  await db.close();
});

test("desk-ops uses the guarded transition and shows desk-friendly errors on Postgres", () => {
  const pgBranch = deskOps.slice(deskOps.indexOf("if (!shouldSkipNeon()) {", deskOps.indexOf("async function runTransition")));
  assert.match(pgBranch, /pgDeskTransition\(payload\)/);
  assert.doesNotMatch(pgBranch.slice(0, pgBranch.indexOf("Desk transition needs the database")), /select tw_desk_transition\(/, "no unguarded call");
  assert.match(pgBranch, /deskTransitionErrorMessage\(message\)/);
  assert.match(deskPg, /if \(hasFreshCancelClaim\(parseSwaps\(swapsText\)\)\) return \{ ok: false, message: DESK_GUEST_CANCELLING_MESSAGE \}/);
  assert.match(deskPg, /DESK_NOT_OPEN_MESSAGE = "That stay is not waiting for this action\."/, "same wording as the Supabase path");
});

test("desk decline marks the stay refund_pending before the gateway, so a crash mid-refund is resumed", () => {
  const fn = deskPg.slice(deskPg.indexOf("export async function pgRefundDeclinedStay"), deskPg.indexOf("export const DESK_NOT_OPEN_MESSAGE"));
  const flip = fn.indexOf("update bookings set status = 'refund_pending'");
  assert.ok(flip > 0 && flip < fn.indexOf("fetchRazorpayPayment(ref)"), "refund_pending before the gateway");
  assert.ok(fn.indexOf('status: "pending"') < flip, "intent saved before the status flip");
  assert.match(fn, /set status = 'refunded', swaps = \$\{JSON\.stringify\(meta\)\}\s+where id = \$\{input\.id\} and package_id = \$\{input\.packageId\} and status = \$\{owedStatus\}/);
  const resume = readFileSync(new URL("./refund-resume.ts", import.meta.url), "utf8");
  // A cancelled row closes its intent without a refund; refund_pending waits out the back-off, then refunds.
  assert.match(resume, /booking\.status === "refund_pending"\)\) \{\s*const updated = Date\.parse\(intent\.updatedAt\);\s*if \(Number\.isFinite\(updated\) && now - updated < 60_000\) continue;/);
});
