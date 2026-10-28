import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const claimSql = readFileSync(new URL("../../../supabase/cancel_claim.sql", import.meta.url), "utf8");
const bookingsSrc = readFileSync(new URL("./bookings.ts", import.meta.url), "utf8");
const sbSrc = readFileSync(new URL("../supabase/bookings.ts", import.meta.url), "utf8");
const rzpSrc = readFileSync(new URL("./razorpay.ts", import.meta.url), "utf8");

/** A Supabase-shaped database: auth.role(), service_role, jsonb swaps, the live status check. */
async function supabaseLike() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.role() returns text language sql as $$ select 'service_role'::text $$;
    create table public.bookings (
      id bigint primary key, user_id text not null, package_id text, amount_inr int,
      swaps jsonb not null default '{}'::jsonb, status text not null,
      constraint bookings_status_check check (status in ('paid','cancelled','pending','failed','held','completed',
        'refunded','confirmed','desk_confirmed','checked_in','refund_pending'))
    );
  `);
  await db.exec(claimSql);
  await db.exec(claimSql); // safe to re-run
  return db;
}
const meta = (swaps: Record<string, string>) => JSON.parse(swaps.__tw ?? "{}") as Record<string, unknown>;
async function rpc<T>(db: PGlite, fn: string, payload: Record<string, unknown>): Promise<T> {
  const res = await db.query<{ r: T }>(`select public.${fn}('service', $1::jsonb) as r`, [JSON.stringify(payload)]);
  return res.rows[0].r;
}
async function row(db: PGlite, id: number) {
  return (await db.query<{ status: string; swaps: Record<string, string> }>(`select status, swaps from bookings where id = $1`, [id])).rows[0];
}

test("tw_cancel_claim: first claim wins, a second is refused, other meta is kept", async () => {
  const db = await supabaseLike();
  await db.query(`insert into bookings (id, user_id, amount_inr, status, swaps) values (1, 'u1', 5000, 'paid', $1::jsonb)`, [
    JSON.stringify({ breakfast: "yes", __tw: JSON.stringify({ roomId: "king", guestEmail: "a@b.c" }) }),
  ]);
  const first = await rpc<{ claim_at: string; booking: { id: number } } | null>(db, "tw_cancel_claim", { id: 1, user_id: "u1" });
  assert.ok(first?.claim_at, "claimed");
  assert.match(first!.claim_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/, "same ISO shape the app writes");
  const second = await rpc(db, "tw_cancel_claim", { id: 1, user_id: "u1" });
  assert.equal(second, null, "fresh claim blocks a second cancel");
  const r = await row(db, 1);
  assert.equal(r.status, "paid");
  assert.equal(r.swaps.breakfast, "yes");
  assert.deepEqual(meta(r.swaps), { roomId: "king", guestEmail: "a@b.c", cancelClaimAt: first!.claim_at });
  await db.close();
});

test("tw_cancel_claim: wrong guest, closed stays and hotel-confirmed stays are not claimable", async () => {
  const db = await supabaseLike();
  await db.exec(`insert into bookings (id, user_id, status) values (1, 'u1', 'paid'), (2, 'u1', 'cancelled'),
    (3, 'u1', 'refunded'), (4, 'u1', 'desk_confirmed'), (5, 'u1', 'checked_in'), (6, 'u1', 'refund_pending')`);
  assert.equal(await rpc(db, "tw_cancel_claim", { id: 1, user_id: "u2" }), null);
  for (const id of [2, 3, 4, 5]) assert.equal(await rpc(db, "tw_cancel_claim", { id, user_id: "u1" }), null, `id ${id}`);
  assert.ok(await rpc(db, "tw_cancel_claim", { id: 6, user_id: "u1" }), "refund_pending can be retried");
  await db.close();
});

test("tw_cancel_claim: an abandoned claim ages out; bad meta JSON reads as no claim", async () => {
  const db = await supabaseLike();
  await db.exec(`insert into bookings (id, user_id, status, swaps) values
    (1, 'u1', 'paid', '{}'), (2, 'u1', 'paid', '{"__tw": "not json"}')`);
  assert.ok(await rpc(db, "tw_cancel_claim", { id: 1, user_id: "u1" }));
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(await rpc(db, "tw_cancel_claim", { id: 1, user_id: "u1", ttl_seconds: 0 }), "expired claim can be taken");
  assert.ok(await rpc(db, "tw_cancel_claim", { id: 2, user_id: "u1" }), "unreadable meta does not block or error");
  await db.close();
});

test("tw_cancel_release gives back only our own claim; tw_cancel_open closes refund_pending, not closed rows", async () => {
  const db = await supabaseLike();
  await db.exec(`insert into bookings (id, user_id, status) values (1, 'u1', 'paid'), (2, 'u1', 'refund_pending'), (3, 'u1', 'cancelled')`);
  const c = await rpc<{ claim_at: string }>(db, "tw_cancel_claim", { id: 1, user_id: "u1" });
  assert.equal(await rpc(db, "tw_cancel_release", { id: 1, user_id: "u1", claim_at: "2000-01-01T00:00:00.000Z" }), false);
  assert.equal(await rpc(db, "tw_cancel_release", { id: 1, user_id: "u1", claim_at: c.claim_at }), true);
  assert.equal(meta((await row(db, 1)).swaps).cancelClaimAt, undefined);
  assert.ok(await rpc(db, "tw_cancel_claim", { id: 1, user_id: "u1" }), "claimable again after release");

  const done = await rpc<{ status: string } | null>(db, "tw_cancel_open", { id: 2, user_id: "u1", status: "refunded", swaps: { __tw: "{}" } });
  assert.equal(done?.status, "refunded", "queued refund can finish");
  assert.equal(await rpc(db, "tw_cancel_open", { id: 3, user_id: "u1", status: "refunded" }), null, "closed stay untouched");
  assert.equal((await row(db, 3)).status, "cancelled");
  await db.close();
});

test("tw_cancel_* are service-role only: no EXECUTE for anon/authenticated, and the body checks auth.role()", async () => {
  const db = await supabaseLike();
  for (const fn of ["tw_cancel_claim", "tw_cancel_release", "tw_cancel_open"]) {
    for (const role of ["anon", "authenticated"]) {
      const res = await db.query<{ ok: boolean }>(`select has_function_privilege($1, $2, 'execute') as ok`, [role, `public.${fn}(text, jsonb)`]);
      assert.equal(res.rows[0].ok, false, `${role} ${fn}`);
    }
  }
  for (const fn of ["tw_cancel_claim", "tw_cancel_release", "tw_cancel_open"]) {
    assert.match(claimSql.slice(claimSql.indexOf(`function public.${fn}(`)), /is distinct from 'service_role'[\s\S]*?raise exception 'forbidden'/);
  }
  await db.close();
});

test("app: Supabase cancel claims before the refund and releases on failure; null finalize is not success", () => {
  const supa = bookingsSrc.slice(bookingsSrc.indexOf("} else if (isSupabaseConfigured()) {\n        // Same guard on Supabase"));
  assert.match(supa, /sbClaimCancel\(context\.userId, id,/);
  assert.match(supa, /claim\.kind === "busy"\) return \{ ok: false, message: CANCEL_IN_PROGRESS_MESSAGE \}/);
  assert.match(supa, /sbReleaseCancel\(context\.userId, id, claimAt\)/);
  assert.ok(bookingsSrc.indexOf("sbClaimCancel(") < bookingsSrc.indexOf("refundRazorpayPayment(ref, amount)"), "claim before the gateway");
  assert.match(bookingsSrc, /if \(!\(await sbCancelBooking\(context\.userId, id, \{ status, swaps: meta \}\)\)\)/);
  assert.match(sbSrc, /return data != null;/);
  assert.match(sbSrc, /PGRST202/, "missing RPC (SQL not applied yet) falls back instead of breaking cancel");
});

test("Razorpay refunds carry X-Refund-Idempotency keyed on payment + amount", async () => {
  assert.match(rzpSrc, /"X-Refund-Idempotency": refundIdempotencyKey\(paymentId, amountPaise\)/);
  assert.match(rzpSrc, /res\.status === 409/);
  const fn = rzpSrc.slice(rzpSrc.indexOf("export function refundIdempotencyKey"), rzpSrc.indexOf("export async function refundRazorpayPayment"));
  const body = fn.slice(fn.indexOf("{") + 1, fn.lastIndexOf("}"));
  const key = new Function("paymentId", "amountPaise", body) as (p: string, a: number) => string;
  assert.equal(key("pay_ABC123xyz", 449500), "twr_pay_ABC123xyz_449500");
  assert.match(key("pay_A.B", 100), /^[A-Za-z0-9_-]{10,}$/, "only characters Razorpay accepts, 10+ long");
  assert.equal(key("pay_X1", 100), key("pay_X1", 100), "same refund, same key");
  assert.notEqual(key("pay_X1", 100), key("pay_X1", 200));
});
