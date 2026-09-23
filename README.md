# TripWeave

Book honest Puri hotel stays with all-in INR prices, traveller details, Razorpay payments, and offline booking passes.

## Features

- **Plan & match** — short preference brief → three package options from a 12-stay Puri catalog, ranked by vibe, budget, nights, **and origin / arrival**
- **Travel** — live last-mile cost from your origin, style-ranked options (hotel transfer / cab / bus + auto), “Plan my travel” for the three matches, optional hotel pickup on Razorpay, and travel details on the desk voucher / offline pass
- **Live rates** — dated seasonal tariffs (festival / weekend / high season) and leftover rooms TripWeave still holds
- **Rooms & occupancy** — official room types; guest count cannot exceed the room’s sleep cap
- **Property media** — photo galleries and YouTube property tours on every stay
- **Travellers** — guest name, phone, email, ID, emergency contact (DigiLocker demo autofill available)
- **Razorpay Standard Checkout** — test cards / UPI; order create + signature verify on the server
- **Hotel confirmation** — desk voucher + mailto to the hotel reservations desk after pay
- **Refunds** — full if you cancel ≥48h before noon check-in, 50% inside that window, none after; Razorpay `pay_` refunds
- **Account profile** — display name and mobile saved to your TripWeave account
- **My trips** — list, cancel & refund, confirmation codes, desk voucher
- **Offline pass** — HTML pass card + calendar (`.ics`); Apple Wallet `.pkpass` when certs are configured
- **Supabase (optional)** — durable `bookings` / `travellers` / `profiles` when env vars are set
- **Reviewer consensus** — structured notes from curated YouTube stay-review videos on every package page

## Stack

- TanStack Start + React Router
- Better Auth (Google and email). Demo guest accounts were removed.
- Razorpay Web Standard Checkout
- Optional Supabase (Postgres + RLS schema in `supabase/schema.sql`)
- Deployed on Vercel

## Quick start

```bash
npm install
cp .env.example .env
# fill Razorpay (+ optional Supabase) keys
npm run dev
```


## Environment variables

### Razorpay (required for real checkout)

| Variable | Where | Notes |
|----------|--------|--------|
| `RAZORPAY_KEY_ID` | Server | Test key from Razorpay Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | Server **only** | Never expose to the browser or commit to git |
| `VITE_RAZORPAY_KEY_ID` | Client | Same as `KEY_ID` (public) |

On **Vercel**: Project → Settings → Environment Variables → add all three → **Redeploy**.

### Google sign-in on Vercel (fixes `Invalid redirect URI`)

The Grok preview Google client **only** allows `*.grok-sandbox.com`. On Vercel you must use **your own Google Cloud OAuth web client**.

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create **OAuth client ID** → application type **Web application**.
3. Authorized JavaScript origins:
   - `https://tripweave-web.vercel.app`
4. Authorized redirect URIs (exact):
   - `https://tripweave-web.vercel.app/api/auth/callback/google`
5. Copy Client ID and Client secret.
6. Vercel → tripweave-web → Settings → Environment Variables (Production):

| Variable | Notes |
|----------|--------|
| `GOOGLE_CLIENT_ID` | Google Cloud client id |
| `GOOGLE_CLIENT_SECRET` | Google Cloud client secret (server only) |
| `BETTER_AUTH_URL` | `https://tripweave-web.vercel.app` |
| `BETTER_AUTH_SECRET` | Random 32+ character string |

7. **Redeploy**. Then **Continue with Google** on the live site.

OAuth consent screen: External is fine; add your Gmail as a test user while the app is in Testing.

### Supabase (recommended for durable bookings + travellers)

Do **not** install `@supabase/server`. Full walkthrough: [`supabase/README.md`](supabase/README.md).

| Variable | Notes |
|----------|--------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY` | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Server only — never `VITE_` |
| `VITE_SUPABASE_URL` | Same URL for the browser |
| `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` | Same public key |
| `DATABASE_URL` | Supabase **transaction pooler** URI (port **6543**) so Better Auth users persist |

Run `supabase/schema.sql` in the SQL Editor, then redeploy.

### Apple Wallet (optional)

Requires Apple Developer Program + Pass Type certificates. See comments in `src/lib/apple-wallet.ts`. Without certs, **Offline pass + calendar** still works after booking.

## Razorpay test credentials

Use **Test mode** keys from the [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).

### Test card (success)

| Field | Value |
|--------|--------|
| Card number | `4100 2800 0000 1007` |
| CVV | `123` |
| Expiry | `12/26` (any future date works in test mode) |

### Test UPI (success)

| Field | Value |
|--------|--------|
| UPI ID | `test@razorpay` |

### Other common Razorpay test cards

| Card | Behaviour |
|------|-----------|
| `4111 1111 1111 1111` | Success (Visa) |
| `5104 0600 0000 0008` | Success (Mastercard) |

Full list: [Razorpay test cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/).

### How to verify a test payment

1. Start the app with test keys set
2. Demo sign-in → choose a stay → fill travellers → **Pay with Razorpay**
3. Complete the checkout modal with the card or UPI above
4. Confirm success on the site and under **My trips**
5. In Razorpay Dashboard → **Transactions** (Test mode), the payment should appear

If the UI says **“Razorpay is not configured”**, the server is missing `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (or the deploy was not restarted after adding them).

## Reviewer consensus (YouTube)

TripWeave does not scrape the open web for ratings. Each stay has a **manual list of 2–4 stay-review videos**. On the package page we show:

- overall sentiment (positive / mixed / negative)
- what reviewers praised and flagged
- caveats (beach is public, book the cottage, skip festival rates)
- source links back to the videos

**How it runs (v1)**

1. Captions are fetched with `youtube-transcript-api-js` (no API key). Language order: Odia → Hindi → English → Bengali → Tamil → Telugu. Manual captions beat auto-generated.
2. Each transcript is summarised to JSON with the xAI chat API when `XAI_API_KEY` is present.
3. Per-video notes are merged into one consensus and cached (memory, then Supabase table `reviewer_consensus` if configured).
4. **Page load** reads the saved consensus or the curated seed. It does not call the model. A curated seed still shows when YouTube or the model is unavailable.
5. **Rebuild from videos** on the package page forces a refresh, and that path needs `XAI_API_KEY`.
6. **Search:** set `YOUTUBE_API_KEY` (Data API v3) and TripWeave adds stay-review videos on top of the hand-picked list in `src/lib/youtube/videos.ts`.

Adding a stay: map video IDs in `src/lib/youtube/videos.ts` and (optionally) a seed entry in `src/lib/youtube/seed.ts`.

## Project layout (selected)

```
src/routes/checkout.tsx      # Razorpay checkout + confirmation + wallet buttons
src/routes/travelers.tsx     # Guest details gate
src/routes/trips.tsx         # Bookings list
src/routes/api/create-order.ts
src/routes/api/verify-payment.ts
src/routes/api/wallet-pass.ts
src/lib/youtube/            # transcripts, summarizer, seed cache, server fns
src/components/reviewer-consensus.tsx
src/lib/server/bookings.ts   # Memory → SQL → Supabase priority
src/lib/supabase/           # Clients + adapters
supabase/schema.sql          # Tables + RLS
```

## Security

Reviewed against the code on `main` (auth, checkout, Supabase SQL, hotel desk, DigiLocker, Wallet, and the public routes). This is the posture of the app. It is not a procedure for calling those endpoints.

### What is in good shape

- **Session on the guest path.** Listing bookings, creating a booking, cancelling, saving travellers, and saving a profile go through `authMiddleware` in `src/lib/auth/middleware.ts`. The handler uses the session user id. A confirmation code on `/voucher/$code` only matches a booking already returned for that signed-in user (`src/routes/voucher.$code.tsx`).
- **Payment check before a browser booking.** `verifyRazorpayPayment` checks the Razorpay signature on the server, then reads the payment from Razorpay, before `createBooking` stores a paid stay (`src/lib/server/razorpay.ts`, `src/lib/server/bookings.ts`). The browser only receives the public key id (`getRazorpayKeyId`, `VITE_RAZORPAY_KEY_ID`).
- **Webhook signature.** `POST /api/verify-payment` rejects a body whose `x-razorpay-signature` does not match HMAC-SHA256 (`settleRazorpayWebhook`). The comparison uses a fixed-time compare. A matching event is ignored unless it is `payment.captured` and the Razorpay order notes contain a user and a stay.
- **Direct table access.** `supabase/schema.sql` enables row level security and adds deny-all policies for `anon` and `authenticated` on bookings, travellers, payments, profiles, and saved stays. `supabase/ops_durability.sql` revokes those roles from `room_holds`, `payment_reconcile_jobs`, and `refund_intents`.
- **Hotel desk in the app.** `assertPartnerStay` (`src/lib/server/partner.ts`) runs on catalog saves, desk booking lists, desk confirmation, and the day-before reminder. The signed-in email must match `HOTEL_DESKS` or an entry in `PARTNER_EMAILS`. The Account screen hides the desk when that list is empty.
- **Identity documents.** Aadhaar is masked before it is kept on the traveller object (`maskAadhaar` in `src/lib/travelers.ts`). The Supabase traveller row stores `id_last4`, not the full number (`tw_apply` op `save_travellers`).
- **Sandbox card charges.** `sandboxPaymentsAllowed` and `payTestAllowed` stay off when `VERCEL` or `NODE_ENV=production` is set (`src/lib/pay.ts`, `src/lib/server/payable.ts`). `/pay-test` redirects away outside local dev.
- **Secrets that stay server-side when set in the host.** `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `XAI_API_KEY`, `YOUTUBE_API_KEY`, DigiLocker client secret, and the Apple pass PEM values are read from `process.env` and are not given a `VITE_` name.

### The database gate is not a secret

This is the main problem.

Postgres writes do not use the service role for the guest. They call `security definer` functions that are **granted to `anon` and `authenticated`**:

| Function | What a caller can do once the gate matches |
|----------|-----------------------------------------------|
| `tw_apply` | List, insert, and cancel bookings; write payment events; read and write travellers and profiles; toggle saved stays; overwrite reviewer consensus |
| `tw_reserve_insert` | Insert a booking row |
| `tw_reserve_hold` / `tw_release_hold` | Take or drop a checkout hold |
| `tw_occupancy` | Read which rooms are held |
| `tw_save_reconcile_job` / `tw_list_reconcile_jobs` | Write and read payment reconcile jobs |
| `tw_save_refund_intent` / `tw_list_refund_intents` | Write and read refund intents |

The gate is a shared string compared inside the function (`p_gate is distinct from expected`). That same string is the default in `src/lib/supabase/write-gate.ts` and is copied into `supabase/schema.sql`. Both files are in this public repository. The project URL and the publishable anon key are also in `src/lib/supabase/project.ts`, which is normal for a publishable key and is what makes the functions reachable.

Row level security does not apply inside these functions. The payload chooses `user_id`. The app’s session check never runs on this path.

`tw_apply` ops `insert_booking` and `cancel_booking` do not check that a Razorpay payment exists. A forged row can look like a paid stay. Traveller rows include name, phone, email, and the last four digits of an ID.

**What to change**

1. Rotate the gate in Postgres and remove the old string from SQL and from `write-gate.ts`. Treat the new value as a server env var only (`SUPABASE_WRITE_GATE`). Do not commit it.
2. `revoke execute` on these functions from `anon` and `authenticated`. Call them with the service role from the server, or verify a Supabase JWT inside the function and set `user_id` from `auth.uid()` rather than from the JSON body.
3. Until that ships, assume bookings, traveller contacts, profiles, holds, and refund rows are readable and writable by anyone who has read the repository.

Catalog, desk, and review RPCs (`tw_save_override`, `tw_desk_bookings`, `tw_confirm_booking`, `tw_save_review`, `tw_catalog`) are invoked with the service-role client from server functions. Those server functions check the session and, for desk actions, the hotel email. If the same functions were created `security definer` and granted to `anon` with the same gate, they have the same exposure. Confirm the live grants in the Supabase SQL editor and revoke `anon` there too.

### Payments

- Browser checkout can still mark a stay paid after a verified Razorpay return inside `createBooking`.
- A guest who closes the tab before that return depends on Razorpay calling `https://tripweave-web.vercel.app/api/verify-payment` for `payment.captured`. The dashboard webhook is not created by this repo. Until it is, a captured payment can exist with no booking.
- If `RAZORPAY_WEBHOOK_SECRET` is unset, the handler signs with `RAZORPAY_KEY_SECRET`. Prefer a separate webhook secret so a leaked key secret is not also the webhook key.
- Sold-out nights after capture try `refundRazorpayPayment`. A failed refund is queued. Nothing in the repo retries that queue on a schedule.
- Amounts for a real stay should be recomputed on the server (`computePayable`). Keep that as the amount sent to Razorpay. Do not trust a price posted from the browser.

### Accounts and the hotel desk

- Login is Better Auth with Google and email. On Vercel, Better Auth is intentionally not pointed at `DATABASE_URL` because a bad pooler password broke Google sign-in. Users and reset tokens can therefore live apart from the Supabase booking rows. A later sign-in may not match `bookings.user_id`.
- Password reset sends through Resend and does nothing until `RESEND_API_KEY` and `RESEND_FROM` are set.
- The hotel desk is not a separate role. Anyone whose Google or email address equals a `HOTEL_DESKS` address, or a `PARTNER_EMAILS` entry, can change that hotel’s rate, photo override, and key count, list its bookings, and mark one confirmed. Protect those inboxes. A value of `email:*` grants every hotel.
- Guest and desk mail, and the day-before reminder, use the same Resend keys. Missing keys leave only the on-site voucher.

### DigiLocker, Wallet, and other public server functions

- `startDigilockerSession` and `completeDigilockerSandbox` (`src/lib/server/digilocker.ts`) have no auth middleware. Without live DigiLocker credentials the complete handler still accepts a fixed sandbox OTP and returns a sample traveller. Do not treat that payload as an identity. The live branch only returns an authorize URL.
- `loadOccupancy` and `quoteCab` are public. Occupancy is room-hold counts. The cab figure is OSRM distance times a fixed rupee rate, not a live operator booking.
- `walletSigningReady` only reports whether Apple pass certs are present. It does not return the PEMs. A real `.pkpass` still needs `APPLE_PASS_*` on the server.
- The preview host bridge posts to the parent frame only when the page is embedded (`window.parent !== window`). It is for the app shell, not for guest data.

### Headers, repo, and deploy

- There is no Content-Security-Policy in the app. Razorpay’s checkout script and Google’s OAuth script are loaded from their own hosts. A policy, if added, has to allow those hosts on purpose.
- This repository is public. Do not commit `.env`, service-role keys, Razorpay secrets, or a new write gate. The publishable Supabase anon key in `project.ts` is not the service role, but it is enough to call any RPC granted to `anon`.
- GitHub warned that `public/cover/coast.mp4` is over the 50 MB recommendation. The hard limit is 100 MB. That is availability of the repo, not guest data.
- Dependency review and secret scanning are not configured in this repo. Turn on GitHub secret scanning and Dependabot, and rotate anything already committed (the write gate first).

### Order to fix

1. Rotate and un-grant the write gate. Re-issue it only as a server env var, or stop using a shared string and use the service role.
2. Point Razorpay’s `payment.captured` webhook at `/api/verify-payment` with `RAZORPAY_WEBHOOK_SECRET`.
3. Put Better Auth users on the same database as bookings.
4. Remove or auth-gate the DigiLocker sandbox completion handler before any real identity flow.
5. Set Resend, then confirm a booking email actually leaves the desk address you intend.

## License

Private / project use unless otherwise stated.
