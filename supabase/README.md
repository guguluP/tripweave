# Supabase — TripWeave

Live project: **TripWeave** (`csegihiepvxezuypsvop`, `ap-south-1`).  
API URL: `https://csegihiepvxezuypsvop.supabase.co`

The app talks to this project over the Data API (`@supabase/supabase-js`). Public URL and anon key are baked into the app. Personal rows (bookings, travellers, saved stays, profiles, payment events) are written through a gated RPC — the browser key cannot read or write those tables directly.

| Table | Who writes | What |
|-------|------------|------|
| `bookings` | Server (secret key) | Paid stays, scoped by Better Auth `user_id` |
| `travellers` | Server | Stay-only guests (last-4 of ID, auto-expire) |
| `payment_events` | Server | Razorpay order/payment ids after capture |
| `reviewer_consensus` | Server write, public read | YouTube stay-review cache |

Login stays **Better Auth** (Google + email). Do not switch to Supabase Auth.

## 1. Apply schema (once)

Dashboard → [SQL Editor](https://supabase.com/dashboard/project/csegihiepvxezuypsvop/sql/new) → paste [`schema.sql`](schema.sql) → Run.

Then paste [`ops_durability.sql`](ops_durability.sql) → Run. That file is safe to re-run. It stores room holds, payment reconcile jobs, and refund intents. Checkout on the live site reserves a room through those functions.

Then paste [`partner_desk_ops.sql`](partner_desk_ops.sql) → Run. Adds per-night allotment, stop-sell, `desk_confirmed` / `checked_in`, desk RPCs, and catalog helpers. Safe to re-run.

Then paste [`foreign_guests.sql`](foreign_guests.sql) → Run. Comments and an index for E.164 phone numbers and ISO nationality. Safe to re-run.

Then paste [`saved_travellers.sql`](saved_travellers.sql) → Run. Saved co-travellers (name, nationality, phone, email, ID type, last 4). No date of birth and no full ID. Safe to re-run.

Then paste [`guest_arrivals.sql`](guest_arrivals.sql) → Run. Optional arrival details and the desk foreign-guest register for Form III. Safe to re-run.

Then paste [`ask_turns.sql`](ask_turns.sql) → Run. Ask TripWeave threads and the 10-an-hour cap. No passport numbers. Safe to re-run.

Then paste [`cancel_claim.sql`](cancel_claim.sql) → Run. Claims a stay in one atomic update before a cancel refunds it, so two servers cannot refund the same stay twice; also lets a queued (`refund_pending`) refund mark the stay refunded. Replaces `tw_cancel_open` (same signature). Safe to re-run.

## 2. Keys on the live site

[API settings](https://supabase.com/dashboard/project/csegihiepvxezuypsvop/settings/api) → copy into **Vercel → tripweave-web → Environment Variables** (Production + Preview):

```text
SUPABASE_URL=https://csegihiepvxezuypsvop.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://csegihiepvxezuypsvop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # or VITE_SUPABASE_ANON_KEY
```

Never put the secret / service role on a `VITE_` name. Redeploy after adding keys.

`VITE_*` is baked at **build** time. Server keys (`SUPABASE_SERVICE_ROLE_KEY`) are enough for bookings even without the browser key.

## 3. Check it worked

1. Open the live site → sign in → pay for a stay.
2. Table Editor → `bookings` should show a row.
3. `payment_events` should show `captured` for that Razorpay payment.

Without keys the app still confirms the stay on this device so a captured payment is never lost.

## MCP (Grok / Cursor)

`.mcp.json` points at this project.

```bash
grok mcp add supabase "https://mcp.supabase.com/mcp?project_ref=csegihiepvxezuypsvop&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching" --transport http
```

Optional: `npx skills add supabase/agent-skills`
