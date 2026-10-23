import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

async function boot() {
  const pg = new PGlite();
  await pg.waitReady;
  await pg.exec(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
    end $$;
    create schema if not exists auth;
    create or replace function auth.role() returns text
    language sql stable
    as $$ select 'service_role'::text $$;
    create table public.ba_user (
      id text primary key,
      name text not null,
      email text not null unique
    );
    create table public.profiles (
      user_id text primary key,
      display_name text,
      email text,
      phone text,
      updated_at timestamptz not null default now()
    );
    create table public.bookings (
      id bigint generated always as identity primary key,
      user_id text,
      swaps jsonb,
      created_at timestamptz not null default now()
    );
    create table public.travellers (
      id bigint generated always as identity primary key,
      booking_id bigint,
      user_id text,
      email text
    );
    create table public.payment_events (
      id bigint generated always as identity primary key,
      user_id text,
      booking_id bigint
    );
    create table public.saved_stays (
      user_id text not null,
      package_id text not null,
      primary key (user_id, package_id)
    );
  `);
  await pg.exec(readFileSync(join(root, "supabase/account_subject.sql"), "utf8"));
  return pg;
}

function twMeta(meta: Record<string, string>) {
  return { __tw: JSON.stringify(meta) };
}

describe("account claim", () => {
  it("does not give a sign-in the trips of a spoofed profile or typed email", async () => {
    const pg = await boot();
    await pg.query(
      `insert into public.ba_user (id, name, email) values ('mallory2', 'Mallory', 'mallory2@example.test')`,
    );
    await pg.query(
      `insert into public.profiles (user_id, email) values ('mallory2', 'victim2@example.test')`,
    );
    const booking = await pg.query<{ id: string }>(
      `insert into public.bookings (user_id, swaps)
       values ('mallory2', $1::jsonb)
       returning id::text`,
      [JSON.stringify(twMeta({ accountEmail: "mallory2@example.test", guestEmail: "victim2@example.test" }))],
    );
    const bookingId = booking.rows[0]?.id;
    await pg.query(
      `insert into public.travellers (booking_id, user_id, email) values ($1::bigint, 'mallory2', 'victim2@example.test')`,
      [bookingId],
    );

    const claimed = await pg.query<{ canon: string }>(
      `select public.tw_claim_subject('victim2@example.test', 'victim2-uid') as canon`,
    );
    assert.equal(claimed.rows[0]?.canon, "victim2-uid");
    const owner = await pg.query<{ user_id: string }>(
      `select user_id from public.bookings where id = $1::bigint`,
      [bookingId],
    );
    assert.equal(owner.rows[0]?.user_id, "mallory2");
  });

  it("links a stay only through the server-set account email", async () => {
    const pg = await boot();
    const owned = await pg.query<{ id: string }>(
      `insert into public.bookings (user_id, swaps, created_at)
       values ('old-guest', $1::jsonb, '2026-01-01')
       returning id::text`,
      [JSON.stringify(twMeta({ accountEmail: "Guest@Example.test" }))],
    );
    const typed = await pg.query<{ id: string }>(
      `insert into public.bookings (user_id, swaps, created_at)
       values ('other-guest', $1::jsonb, '2026-02-01')
       returning id::text`,
      [JSON.stringify(twMeta({ guestEmail: "guest@example.test" }))],
    );
    const claimed = await pg.query<{ canon: string }>(
      `select public.tw_claim_subject('guest@example.test', 'new-session') as canon`,
    );
    assert.equal(claimed.rows[0]?.canon, "old-guest");
    const rows = await pg.query<{ id: string; user_id: string }>(
      `select id::text, user_id from public.bookings order by id`,
    );
    const byId = new Map(rows.rows.map((row) => [row.id, row.user_id]));
    assert.equal(byId.get(owned.rows[0]!.id), "old-guest");
    assert.equal(byId.get(typed.rows[0]!.id), "other-guest");
  });

  it("blanks a profile email that disagrees with the sign-in address", async () => {
    const pg = await boot();
    await pg.query(
      `insert into public.ba_user (id, name, email) values
         ('mallory2', 'Mallory', 'mallory2@example.test'),
         ('ok-user', 'Ok', 'ok@example.test')`,
    );
    await pg.query(
      `insert into public.profiles (user_id, email) values
         ('mallory2', 'victim2@example.test'),
         ('ok-user', 'OK@example.test')`,
    );
    await pg.exec(readFileSync(join(root, "supabase/account_subject.sql"), "utf8"));
    const rows = await pg.query<{ user_id: string; email: string }>(
      `select user_id, email from public.profiles order by user_id`,
    );
    const byUser = new Map(rows.rows.map((row) => [row.user_id, row.email]));
    assert.equal(byUser.get("mallory2"), "");
    assert.equal(byUser.get("ok-user"), "OK@example.test");
  });
});
