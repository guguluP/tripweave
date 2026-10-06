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

The app is one TanStack Start project. Pages and server functions ship together. The browser never holds a service credential. Postgres is reached only from the server, through security-definer functions that accept the Supabase service role. Vercel Speed Insights is mounted in the root layout (`src/routes/__root.tsx`) so production collects Core Web Vitals; the content policy allows the Vercel vitals script and endpoint.

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
              checkout stops — the room is not reserved
```

### Request path

1. **Plan** (`src/routes/plan.tsx`) stores a brief in the browser. “Coming from” searches the short arrival list, then a wider India and abroad catalog (`src/lib/world-cities.ts`), then any typed city. The first plan with no saved brief starts from the home city on the account page. That city stays in local storage. Festival or deep-link dates in the URL (`checkIn`, `nights`) stay on the plan form and the matches line; `nights` stays a plain number. Google Flights opens with those stay dates.
2. **Match** ranks the twelve stays in `src/lib/packages-data-a.ts` and `packages-data-b.ts` by vibe, budget, nights, and arrival. Trust scores are computed in `src/lib/trust-score.ts`.
3. **Stay** (`src/routes/trip.$id.tsx`) shows the property gallery, official room types, leftover keys, a travel quote, and reviewer notes. Photos come from `src/lib/stay-media.json` and `public/stays/`.
4. **Travellers** collects the guest, phone, email, masked identity, and an emergency contact.
5. **Checkout** creates a Razorpay order for an amount computed on the server (`computePayable`). The amount is the room for those nights, each selected add-on once, and the car once. Guest count does not multiply it. The count still cannot exceed the number of people the room sleeps. “Today” is the calendar day in India (`Asia/Kolkata`). Before the window opens, `reserveCheckoutHold` asks Postgres for the nights. A sold-out room stops checkout. A missing or rejected service client also stops checkout. The room is not reserved in process memory.
6. **Verify.** The browser returns the Razorpay signature. The server checks it, reads the payment from Razorpay, then writes the booking. A confirmation code is `TW-` plus 10 characters.
7. **After pay.** The guest gets a voucher, an HTML pass, and a calendar file. Apple Wallet is added only when pass certificates are configured. Cancellation follows `src/lib/refund-policy.ts`: full refund at least 48 hours before noon IST on check-in, half inside that window, none after. A refund that was saved but not finished is tried again when that guest opens My trips, and on the daily refund cron. It uses the amount already decided and does not send the money twice. When the desk declines a paid stay, the booking is closed first, then Razorpay is refunded in full; a failed refund is queued as refund_pending so cron/My trips can finish it.

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

The desk is the same account system. `assertPartnerStay` allows catalog overrides, booking lists, and confirmation only when the signed-in email matches `HOTEL_DESKS` or `PARTNER_EMAILS`. There is no separate desk role. Confirm, decline, and complete update the booking row even when `tw_desk_transition` is missing from the database. Declining a paid stay refunds the full payment (see After pay). The desk sign-in page asks for that property’s desk key in plain hotel language.

Nightly units and stop-sell go through `tw_set_allotment` (`deskSetAllotment`). Each save is one room on one night in India time. Past nights are refused. The published count cannot drop below stays and live holds already on that room for that night; other dates keep their own counts. Apply `supabase/partner_desk_ops.sql` on the live database so the two-argument RPC the desk posts actually exists.

### Travel links

Arrival mode picks the gateway: the airport, Puri railway station, or the bus stand. Cab buttons for Ola, Uber, and Odisha Yatri carry the pickup and drop names and coordinates from the page. The guest can edit those names. Train stays on IRCTC. Bus stays on OSRTC and Ama Bus. Odisha Yatri’s public site does not document reading those query parameters into its form, so the app may still ask the guest to confirm the drop.

Hotel pickup is separate from those links. Only hotels that publish their own airport car — Taj, Mayfair Heritage, and Hans — offer an airport pickup-and-drop switch, and only when the guest flies. Turning it on records a request for that included car and adds ₹0 to the TripWeave bill; the hotel bills the shuttle. Other hotels keep the cab links and do not show a paid TripWeave pickup estimate. TripWeave does not book that car with the hotel, Ola, or Uber. Stay and trip maps open on Mappls (Survey of India boundary) for the hotel pin and the airport-to-hotel frame (`src/lib/mappls.ts`). The rupee cab lines under the map are ₹50 plus ₹25 per kilometre of driving distance, not a live cab fare.

### Media and motion

Stay photos are local JPEGs under `public/stays/`. The build does not hotlink hotel CDNs. The stay page opens with a cover about 35 percent of the screen; the hotel name and place line sit on the bottom of that photo, clear of the booking bar. Property and Rooms underneath list the other saved frames at the file’s own size, with no blank band between the cover and the filmstrip. A room strip shows only that room’s own photos. Some room files are the same JPEG the hotel published for a gallery frame. The full-screen viewer is swipeable; next and previous sit above the booking bar. On mobile, the booking bar keeps the price and Book this stay on one line.

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
src/lib/mappls.ts           Mappls direction embeds (Survey of India)
src/lib/refund-policy.ts    IST refund windows
src/lib/world-cities.ts     plan-page city search
supabase/schema.sql         tables, RLS, and the tw_* functions
public/favicon.svg          tab icon
public/stays/               hotel JPEGs
public/cover/               homepage still and 4K clips
```

## Updated files (Sep 2026)

Recent product notes that belong in this README (lockup, maps, pickup, desk, and plan dates).

| File / area | Change |
| --- | --- |
| `src/components/logo.tsx` / brand assets | Lockup is circle mark + live wordmark. No single cropped JPEG. |
| `src/lib/mappls.ts` / travel maps | Stay and trip maps use Mappls (Survey of India boundary). |
| Hotel airport car | Taj, Mayfair Heritage, and Hans only; fly arrivals; ₹0 on TripWeave. |
| Plan deep-links | Festival `checkIn` / `nights` stay in the URL and on the form. |
| Stay photo UI | Shorter cover, swipeable viewer, one-line mobile booking bar. |
| Desk confirm / decline | Works without `tw_desk_transition`; decline closes then refunds (or queues refund_pending). |
| Desk allotment | `tw_set_allotment` / `deskSetAllotment`: one room one night; apply `partner_desk_ops.sql`. |
| Vercel Speed Insights | Mounted in `__root.tsx` for production Core Web Vitals. |
| Session / bookings path | Sign-in email maps back to the account that already owns those trips. |
| `src/components/rath-carousel.tsx` | Stills hold 7s; films play through muted, then the next frame. |

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
| `RAZORPAY_WEBHOOK_SECRET` | HMAC for `POST /api/verify-payment`. Required. The key secret is not accepted. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google web client. Redirect: `https://tripweave-web.vercel.app/api/auth/callback/google` |
| `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` | Auth base URL and signing secret |
| `SUPABASE_URL`, `VITE_SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY` | Public key, also as `VITE_` for the browser |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Legacy service-role JWT. Server only. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Password reset through a mailbox you already have (Gmail: host `smtp.gmail.com`, port `465`). `SMTP_FROM` is that same address. No site domain. |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SES_FROM` | Amazon SES for booking mail, stay reminders, and password reset when SMTP is unset. `SES_FROM` must be a verified SES identity. |
| `XAI_API_KEY` | Rebuild reviewer notes. Not used on ordinary page loads. |
| `YOUTUBE_API_KEY` | Optional extra stay-review search |
| `HOTEL_DESKS`, `PARTNER_EMAILS` | Emails allowed to open a hotel desk |
| `APPLE_PASS_*` | Optional Wallet certificates. The HTML pass works without them. |

`DATABASE_URL` may be present for other tools. Better Auth on Vercel does not use it. A bad pooler password previously broke Google sign-in. On Vercel, with `SUPABASE_SECRET_KEY` set, sign-in is stored in `ba_user`, `ba_session`, `ba_account`, and `ba_verification` (`supabase/auth_identity.sql`). Apply that file in the Supabase SQL editor before relying on reset links. A password reset email is a link, sent through SMTP when `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` are set. That mailbox can be a Gmail address; the site does not need its own domain. Amazon SES is used for the reset only when those SMTP values are unset. `tw_claim_subject` keeps one booking id per sign-in email.

Razorpay test cards and UPI ids are documented by Razorpay: [test cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/). Sandbox card charges stay off when `VERCEL` or `NODE_ENV=production` is set.

## Security

This is the posture of `main`. It is not a procedure for calling the endpoints.

**Session.** Listing bookings, creating a booking, cancelling, saving travellers, and saving a profile go through `authMiddleware`. The handler uses the stable account id for that sign-in email, not a fresh cookie id. A voucher URL only opens a booking already returned for that user.

**Payment.** `verifyRazorpayPayment` checks the Razorpay signature, then reads the payment from Razorpay, before a paid booking is stored. The webhook rejects a body whose `x-razorpay-signature` does not match HMAC-SHA256, compared in fixed time. A matching event is ignored unless it is `payment.captured` and the order notes contain a user and a stay. The amount sent to Razorpay is recomputed on the server.

**Database.** Direct table policies deny `anon` and `authenticated`. The `tw_*` functions no longer trust a shared password. Execute is revoked from `public`, `anon`, and `authenticated`. A call with the publishable key returns permission denied. The old password remains in git history and does not work against the live functions. Do not commit a replacement, a service-role key, or a `.env`.

**Identity.** Aadhaar, passport, and licence numbers are reduced to the last four characters before they are kept in this browser. The traveller row stores those four characters. The DigiLocker control on the traveller page is a labelled sample. Without live DigiLocker credentials it returns a sample traveller for a fixed sandbox OTP. That payload is not an identity.

**Desk.** Anyone whose sign-in email matches the desk list can change that hotel’s rate, photos, and nightly unit count. A unit save is one room on one night and cannot go under stays already booked. Protect those inboxes. `email:*` is refused. A desk grant needs `email:packageId`.

**Known gaps.**

- A guest who closes the tab after paying depends on Razorpay calling `https://tripweave-web.vercel.app/api/verify-payment`. This repo does not create that webhook. Until it exists, a captured payment can have no booking.
- `POST /api/verify-payment` accepts only `RAZORPAY_WEBHOOK_SECRET`. The Razorpay dashboard webhook to that URL is still created outside this repo.
- Pending refunds retry on `GET /api/cron/refund-retry` when `CRON_SECRET` matches. Opening My trips still retries that guest’s queue. Captured orders with no booking are listed by `GET /api/cron/reconcile-unbooked`.
- Checkout refuses to open Razorpay when the shared room hold is missing. There is no in-process hold fallback.
- Better Auth rows live in Supabase `ba_*` tables. Bookings attach through the verified email on `account_subjects` (`tw_claim_subject`). Password reset mail uses SMTP when those values are set, otherwise Amazon SES; it stays off until one of those is configured, and the booking row records whether that mail was accepted.
- Content-Security-Policy is set in `server/middleware/csp.ts`. Razorpay, Google, and Vercel Speed Insights are explicit script / connect hosts.
- `loadOccupancy` and `quoteCab` are public and rate-limited. Occupancy is which rooms are taken. Hold ids in that response are a hash, not confirmation codes. The cab figure is a distance times a fixed rate, not a live operator price.
- The public host is still `tripweave-web.vercel.app`. A custom domain needs a name you control, then Vercel plus the Google OAuth redirect. Do not add more hotels until a few Puri desks are on a real key count, the webhook is live, and Trust Scores separate.

## License

Private / project use unless otherwise stated.
