# Supabase setup for TripWeave (step by step)

TripWeave login is **Better Auth** (Google + email). Supabase stores **bookings** (long-lived) and **stay-only travellers** (last-4 of ID, auto-expire). DigiLocker documents are never stored.  
Do **not** run `npm install @supabase/server`. Do **not** use `SUPABASE_JWKS_URL` unless you switch to Supabase Auth (we are not).

---

## A. Create the project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Name it (e.g. `tripweave`), pick a region close to users, set a strong database password — **save that password**.
3. Wait until the project is **Active**.

## B. Copy API keys

**Project Settings → API** (or **API Keys**):

| Copy this | Paste as |
|-----------|----------|
| Project URL (`https://xxxx.supabase.co`) | `SUPABASE_URL` and `VITE_SUPABASE_URL` |
| `anon` **or** `sb_publishable_...` | `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY` and the matching `VITE_*` |
| `service_role` **or** `sb_secret_...` | `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` (**never** `VITE_`) |

## C. Apply the hotel schema

1. Dashboard → **SQL Editor** → New query.
2. Paste the full contents of [`schema.sql`](schema.sql) from this folder.
3. **Run**. You should see tables `bookings`, `travellers`, `payment_events`.

## D. Database URL for sign-in users (important)

Better Auth needs Postgres on Vercel or Google/email accounts will not persist.

1. Settings → **Database** → **Connection string**.
2. Choose **Transaction pooler** (port **6543**, host like `aws-0-….pooler.supabase.com`).
3. Mode: Session can fail on serverless; **Transaction** is the right one.
4. Replace `[YOUR-PASSWORD]` with the password from step A.
5. Set as `DATABASE_URL` on Vercel.

Example shape (do not commit the real password):

```text
postgresql://postgres.YOURREF:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

Then run Better Auth tables once in SQL Editor if they are missing — contents of `migrations/0001_auth.sql` and `migrations/0002_bookings.sql` in the repo (if not already applied by a build).

## E. Vercel environment variables

**Vercel → tripweave-web → Settings → Environment Variables** → Production (and Preview if you want):

```text
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-....pooler.supabase.com:6543/postgres
BETTER_AUTH_URL=https://tripweave-web.vercel.app
BETTER_AUTH_SECRET=a-long-random-string-at-least-32-chars
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=....
```

`VITE_*` is baked in at **build** time — you must **Redeploy** after adding them.

## F. Check it worked

1. Open [tripweave-web.vercel.app](https://tripweave-web.vercel.app) → Sign in (email or Google).
2. Complete a test booking.
3. Supabase → **Table Editor** → `bookings` should show a row with your user id.

## Security

- Never put `SUPABASE_SECRET_KEY` / `service_role` / `GOOGLE_CLIENT_SECRET` in `VITE_*`.
- Rotate any secret that was pasted in chat.
- RLS is on; the server still filters by Better Auth `user_id`.
