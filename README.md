# TripWeave

Book honest Puri hotel stays with all-in INR prices, traveller details, Razorpay payments, and offline booking passes.

## Features

- **Plan & match** — short preference brief → three package options
- **Travellers** — guest name, phone, email, ID, emergency contact (DigiLocker demo autofill available)
- **Razorpay Standard Checkout** — test cards / UPI; order create + signature verify on the server
- **My trips** — list, cancel, confirmation codes
- **Offline pass** — HTML pass card + calendar (`.ics`); Apple Wallet `.pkpass` when certs are configured
- **Supabase (optional)** — durable `bookings` / `travellers` when env vars are set
- **Demo mode** — sign in without a database to test the full payment flow

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

### Supabase (optional, recommended for production data)

| Variable | Notes |
|----------|--------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| `VITE_SUPABASE_URL` | Same URL for browser |
| `VITE_SUPABASE_ANON_KEY` | Same anon key |

Run `supabase/schema.sql` in the Supabase SQL Editor. See `supabase/README.md`.

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

## Project layout (selected)

```
src/routes/checkout.tsx      # Razorpay checkout + confirmation + wallet buttons
src/routes/travelers.tsx     # Guest details gate
src/routes/trips.tsx         # Bookings list
src/routes/api/create-order.ts
src/routes/api/verify-payment.ts
src/routes/api/wallet-pass.ts
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
