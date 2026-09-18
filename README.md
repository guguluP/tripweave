# TripWeave

Book honest Puri hotel stays with all-in INR prices, traveller details, Razorpay payments, and offline booking passes.

## Features

- **Plan & match** — short preference brief → three package options from a 12-stay Puri catalog, ranked by vibe, budget, nights, **and origin / arrival**
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
- **Demo mode** — sign in without a database to test the full payment flow
- **Reviewer consensus** — structured notes from curated YouTube stay-review videos on every package page

## Stack

- TanStack Start + React Router
- Better Auth (email / demo guest)
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

Open the app, use **Demo** sign-in if auth DB is not configured, then plan → travellers → checkout.

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

## Demo flow (no database)

1. Open **Login** → **Continue as demo**
2. Plan a trip and select a package
3. Add traveller details (or use DigiLocker demo fill)
4. Pay with the Razorpay test card / UPI above
5. Save **Offline pass + calendar** or open **My trips**

Bookings in demo mode are stored in the browser (`localStorage`) unless Supabase is configured.

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
4. **Demo / offline:** a curated seed cache ships with the app, so every stay still has a consensus when YouTube rate-limits or the LLM is off. Page load never calls the LLM.
5. **Rebuild from videos** on the package page is the admin/user force-refresh. Sequential, rate-limited.

Adding a stay: map video IDs in `src/lib/youtube/videos.ts` and (optionally) a seed entry in `src/lib/youtube/seed.ts`. Automatic YouTube search is a later step.

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

## Security notes

- Never put `RAZORPAY_KEY_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` in `VITE_*` variables
- Payment signatures are verified on the server before a booking is marked paid
- Supabase service role is server-only; queries are scoped by authenticated `user_id`

## License

Private / project use unless otherwise stated.
