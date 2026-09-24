# TripWeave

TripWeave is a Puri hotel site. A guest answers a short brief — dates, how they are arriving, and what the trip is for — and the catalog returns three stays out of twelve. The guest books one room, pays in INR with Razorpay, and leaves with a confirmation code, a desk voucher, and an offline pass.

Live site: [tripweave-web.vercel.app](https://tripweave-web.vercel.app). Repository: [guguluP/tripweave](https://github.com/guguluP/tripweave).

## Brand

The header and footer use a two-part lockup, not a single pasted image.

| Piece | File | What it is |
| --- | --- | --- |
| Circle mark | `src/components/brand-assets.ts` (`MARK_SRC`) | Transparent WebP of the Jagannath deul on a dark-sea disk with one cyan wave. Full circle — the wave is not cropped. |
| Wordmark | `src/components/logo.tsx` (`BrandWord`) | Live text: `Trip` in navy, `W` in teal, `eave` in saffron. |
| Lockup | `src/components/logo.tsx` (`BrandLockup`) | Mark + wordmark in a row. Used by `src/components/shell.tsx`. |
| Tab icon | `public/favicon.svg` | Same night-sea disk for the browser tab. |

Do not swap the lockup back to one raster JPEG. A cropped photo sat on the cream header as a box and sliced the bottom of the circle.

## Architecture

The app is one TanStack Start project. Pages and server functions ship together. The browser never holds a service credential. Postgres is reached only from the server, through security-definer functions that accept the Supabase service role.

```
Browser
  routes (plan, matches, stay, travellers, checkout, trips, voucher, account)
  public photos and cover video
        │
        ▼
TanStack Start server functions
  session (Better Auth)  ·  payable amount  ·  Razorpay order and signature
        │
        ├── service role ──► Supabase Postgres
        │                      tw_* functions (security definer)
        │                      bookings, travellers, profiles, holds, refunds
        │
        └── if that client is missing or rejected
              in-process hold book for this server only
```

### Request path

1. **Plan** (`src/routes/plan.tsx`) stores a brief in the browser. “Coming from” searches the short arrival list, then a wider India and abroad catalog (`src/lib/world-cities.ts`), then any typed city. The first plan with no saved brief starts from the home city on the account page. That city stays in local storage.
2. **Match** ranks the twelve stays in `src/lib/packages-data-a.ts` and `packages-data-b.ts` by vibe, budget, nights, and arrival. Trust scores are computed in `src/lib/trust-score.ts`.
3. **Stay** (`src/routes/trip.$id.tsx`) shows the property gallery, official room types, leftover keys, a travel quote, and reviewer notes. Photos come from `src/lib/stay-media.json` and `public/stays/`.
4. **Travellers** collects the guest, phone, email, masked identity, and an emergency contact.
5. **Checkout** creates a Razorpay order for an amount computed on the server (`computePayable`). The amount is the room for those nights, each selected add-on once, and the car once. Guest count does not multiply it. The count still cannot exceed the number of people the room sleeps. “Today” is the calendar day in India (`Asia/Kolkata`). Before the window opens, `reserveCheckoutHold` asks Postgres for the nights. A sold-out room stops checkout. A missing or rejected service client falls back to the in-process hold book so the window can still open. That fallback hold is not shared across server instances.
6. **Verify.** The browser returns the Razorpay signature. The server checks it, reads the payment from Razorpay, then writes the booking. A confirmation code is `TW-` plus 10 characters.
7. **After pay.** The guest gets a voucher, an HTML pass, and a calendar file. Apple Wallet is added only when pass certificates are configured. Cancellation follows `src/lib/refund-policy.ts`: full refund at least 48 hours before noon IST on check-in, half inside that window, none after. A refund that was saved but not finished is tried again when that guest opens My trips. It uses the amount already decided and does not send the money twice.

Cookie sessions mint a new Better Auth user id on each login. `tw_claim_subject` maps the sign-in email back to the id that already owns that guest’s bookings, saved stays, and travellers.

### Data

| Store | What it holds | Who can reach it |
| --- | --- | --- |
| Catalog in the repo | Twelve hotels, room types, prices, photo index | Anyone with the repository. No guest rows. |
| Browser storage | Brief, saved stays, account home city | That browser only. |
| Better Auth | Sign-in session, Google and email | Server. On Vercel, users and reset tokens are the Supabase `ba_*` tables, not `DATABASE_URL`. |
| Supabase `tw_*` | Bookings, travellers, profiles, room holds, refunds, desk overrides, review cache | Service role only. `anon` and `authenticated` cannot execute the functions. |
| Razorpay | Orders and captures | Server secret. The browser receives the public key id. |

`getSupabaseAdmin` (`src/lib/supabase/server.ts`) builds a client only when `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` is set. It does not fall back to the anon key. The value on Vercel must be the legacy service-role JWT (it starts with `eyJ`). The newer `sb_secret_` key is rejected by PostgREST.

Row level security on the tables denies `anon` and `authenticated`. The functions are the write path, and each one refuses a caller whose `auth.role()` is not `service_role` (the database owner can still run them for maintenance). `user_id` inside a payload is whatever the server put there. The session check happens before that call.

### Hotel desk

The desk is the same account system. `assertPartnerStay` allows catalog overrides, booking lists, and confirmation only when the signed-in email matches `HOTEL_DESKS` or `PARTNER_EMAILS`. There is no separate desk role.

### Travel links

Arrival mode picks the gateway: the airport, Puri railway station, or the bus stand. Cab buttons for Ola, Uber, and Odisha Yatri carry the pickup and drop names and coordinates from the page. The guest can edit those names. Train stays on IRCTC. Bus stays on OSRTC and Ama Bus. Odisha Yatri’s public site does not document reading those query parameters into its form, so the app may still ask the guest to confirm the drop.

### Media and motion

Stay photos are local JPEGs under `public/stays/`. The build does not hotlink hotel CDNs. Each gallery lists a frame once. A room strip shows only that room’s own photos. Two hotels still share one published file across two room names, because that is the file the hotel published.

The homepage cover plays the beach still, then crossfades between three clips. Screens that report high dynamic range and can play HEVC get the 10-bit HLG files. Every other screen gets the tonemapped H.264 files.

Rath Yatra and Konark (`src/components/rath-carousel.tsx`) advance every frame. Stills hold for 7 seconds. A film plays through, muted, then the next frame starts. Choosing a chapter jumps there. The incoming frame fades in while easing from a slight zoom. The caption rises with the new frame, and the active chapter fills a 7-second bar. `src/components/crossfade.tsx` is the same dissolve for those carousels, the stay photo, the full-screen viewer, and room thumbnails. Route changes fade the page body in (`page-fade` in `src/styles.css`). The header stays put. Reduced-motion settings collapse those transitions.

Chandrabhaga sand stills in the Konark set are stored right-side up (`Sand Face`, `Three Faces`, `Lotus Shrine`).

Reviewer notes are a curated set of YouTube stay videos. A page load reads the saved consensus or the seed. It does not call a model. Rebuilding the notes needs `XAI_API_KEY`.

The mobile tab bar (`Discover`, `Plan`, `Trips`, `Account`) is `position: fixed`. Long stay names and Razorpay lines must not widen the page or the bar slides sideways.

## Layout

```
src/routes/                 pages and the three public API routes
src/components/shell.tsx    header, footer, mobile tab bar
src/components/logo.tsx     WeaveMark, BrandWord, BrandLockup
src/components/brand-assets.ts
                            MARK_SRC data URI (transparent circle)
src/components/rath-carousel.tsx
src/lib/packages*.ts        the twelve-stay catalog
src/lib/stay-media.json     photo index for public/stays
src/lib/server/             bookings, holds, Razorpay, desk, mail
src/lib/supabase/           service client and RPC adapters
src/lib/auth/               Better Auth session and route guards
src/lib/travel-plan.ts      arrival, last mile, cab links
src/lib/refund-policy.ts    IST refund windows
src/lib/world-cities.ts     plan-page city search
supabase/schema.sql         tables, RLS, and the tw_* functions
public/favicon.svg          tab icon
public/stays/               hotel JPEGs
public/cover/               homepage still and 4K clips
```

## Updated files (Sep 2026)

These are the files that changed for the current lockup, session fix, and carousels.

| File | Change |
| --- | --- |
| `src/components/logo.tsx` | Lockup is circle mark + live wordmark. No single cropped JPEG. |
| `src/components/brand-assets.ts` | Transparent WebP of the full night-sea circle (`MARK_SRC`). |
| `src/components/shell.tsx` | Header and footer render `BrandLockup`. |
| `public/favicon.svg` | Night-sea temple disk for the tab. |
| `src/components/rath-carousel.tsx` | Stills hold 7s; films play through muted, then the next frame. |
| `src/routes/trip.$id.tsx` | Stay price caption stays in one JSX expression so production build succeeds. |
| Session / bookings path | Sign-in email maps back to the account that already owns those trips. |
| Konark stills | Chandrabhaga sand photos rotated right-side up. |
| `src/styles.css` / account layout | Mobile tab bar no longer shifts when a line is too wide. |

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Checkout needs Razorpay test keys. Bookings survive a restart only when the Supabase service key is set and `supabase/schema.sql` has been applied. See [`supabase/README.md`](supabase/README.md).

## Configuration

Set these on the server. Never prefix a secret with `VITE_`. After a change on Vercel, redeploy. A saved variable is not visible to the deployment that is already running.

| Variable | Role |
| --- | --- |
| `RAZORPAY_KEY_ID`, `VITE_RAZORPAY_KEY_ID` | Public Razorpay key |
| `RAZORPAY_KEY_SECRET` | Server only |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC for `POST /api/verify-payment`. If unset, the handler uses the key secret. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google web client. Redirect: `https://tripweave-web.vercel.app/api/auth/callback/google` |
| `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` | Auth base URL and signing secret |
| `SUPABASE_URL`, `VITE_SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY` | Public key, also as `VITE_` for the browser |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Legacy service-role JWT. Server only. |
| `RESEND_API_KEY` | Booking mail and password reset. Mail does not send until this is set. |
| `XAI_API_KEY` | Rebuild reviewer notes. Not used on ordinary page loads. |
| `YOUTUBE_API_KEY` | Optional extra stay-review search |
| `HOTEL_DESKS`, `PARTNER_EMAILS` | Emails allowed to open a hotel desk |
| `APPLE_PASS_*` | Optional Wallet certificates. The HTML pass works without them. |

`DATABASE_URL` may be present for other tools. Better Auth on Vercel does not use it. A bad pooler password previously broke Google sign-in. On Vercel, with `SUPABASE_SECRET_KEY` set, sign-in is stored in `ba_user`, `ba_session`, `ba_account`, and `ba_verification` (`supabase/auth_identity.sql`). Apply that file in the Supabase SQL editor before relying on reset links. A password reset email is sent when `RESEND_API_KEY` is set. `RESEND_FROM` is optional; if it is unset, mail uses Resend's test sender `onboarding@resend.dev`, which delivers only to the Resend account address. `tw_claim_subject` keeps one booking id per sign-in email.

Razorpay test cards and UPI ids are documented by Razorpay: [test cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/). Sandbox card charges stay off when `VERCEL` or `NODE_ENV=production` is set.

## Security

This is the posture of `main`. It is not a procedure for calling the endpoints.

**Session.** Listing bookings, creating a booking, cancelling, saving travellers, and saving a profile go through `authMiddleware`. The handler uses the stable account id for that sign-in email, not a fresh cookie id. A voucher URL only opens a booking already returned for that user.

**Payment.** `verifyRazorpayPayment` checks the Razorpay signature, then reads the payment from Razorpay, before a paid booking is stored. The webhook rejects a body whose `x-razorpay-signature` does not match HMAC-SHA256, compared in fixed time. A matching event is ignored unless it is `payment.captured` and the order notes contain a user and a stay. The amount sent to Razorpay is recomputed on the server.

**Database.** Direct table policies deny `anon` and `authenticated`. The `tw_*` functions no longer trust a shared password. Execute is revoked from `public`, `anon`, and `authenticated`. A call with the publishable key returns permission denied. The old password remains in git history and does not work against the live functions. Do not commit a replacement, a service-role key, or a `.env`.

**Identity.** Aadhaar, passport, and licence numbers are reduced to the last four characters before they are kept in this browser. The traveller row stores those four characters. The DigiLocker control on the traveller page is a labelled sample. Without live DigiLocker credentials it returns a sample traveller for a fixed sandbox OTP. That payload is not an identity.

**Desk.** Anyone whose sign-in email matches the desk list can change that hotel’s rate, photos, and key count. Protect those inboxes. A value of `email:*` grants every hotel.

**Known gaps.**

- A guest who closes the tab after paying depends on Razorpay calling `https://tripweave-web.vercel.app/api/verify-payment`. This repo does not create that webhook. Until it exists, a captured payment can have no booking.
- Prefer `RAZORPAY_WEBHOOK_SECRET` over reusing the key secret.
- A failed refund after a sold-out capture is queued. Opening My trips retries a pending refund for that guest. Nothing in the repo retries the queue on a clock while the guest is away.
- Better Auth rows live in Supabase `ba_*` tables. Bookings still attach through `tw_claim_subject` and the sign-in email. Password reset mail stays off until Resend is set.
- There is no Content-Security-Policy. Razorpay and Google load scripts from their own hosts. A policy has to allow those hosts on purpose.
- `loadOccupancy` and `quoteCab` are public. Occupancy is which rooms are taken. Hold ids in that response are a hash, not confirmation codes. The cab figure is a distance times a fixed rate, not a live operator price.

## License

Private / project use unless otherwise stated.
