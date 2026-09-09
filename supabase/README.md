# Supabase setup for TripWeave

TripWeave uses **Better Auth** for Google / email login and **`@supabase/supabase-js`**
for bookings + travellers. Skip `@supabase/server` and `SUPABASE_JWKS_URL` unless
you are writing Supabase Edge Functions that verify **Supabase Auth** JWTs.

## 1. Create a project
1. Go to https://supabase.com → New project
2. Note **Project URL**
3. Copy a **public** key (`anon` JWT **or** `sb_publishable_...`)
4. Copy a **server** key (`service_role` JWT **or** `sb_secret_...`)
5. Note **Database** connection string (Settings → Database → URI) if you want Better Auth on the same Postgres

## 2. Apply schema
SQL Editor → New query → paste contents of `schema.sql` → Run

## 3. Environment variables

Either naming style works — the app reads both.

### Local `.env`
```bash
SUPABASE_URL=https://xxxx.supabase.co

# Public (pick one style)
SUPABASE_ANON_KEY=eyJ...
# or
# SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Server only — never VITE_
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# or
# SUPABASE_SECRET_KEY=sb_secret_...

VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
# or
# VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Optional: Better Auth / Kysely on same Postgres (transaction pooler :6543)
# DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Vercel
Add the same keys under Project → Settings → Environment Variables, then **Redeploy**.
`VITE_*` is baked in at build time.

## 4. Behaviour
| Config | Bookings storage |
|--------|------------------|
| `SUPABASE_URL` + service/secret or anon/publishable | Supabase `bookings` table |
| else `DATABASE_URL` | Existing Postgres/PGLite path |
| else | In-memory / demo localStorage |

## 5. Security
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` must only live on the server
- Server always filters by Better Auth `user_id`
- RLS policies protect direct client access if you later use Supabase Auth
