# Supabase setup for TripWeave

## 1. Create a project
1. Go to https://supabase.com → New project
2. Note **Project URL**, **anon public** key, and **service_role** key (Settings → API)
3. Note **Database** connection string (Settings → Database → URI)

## 2. Apply schema
SQL Editor → New query → paste contents of `schema.sql` → Run

## 3. Environment variables

### Local `.env`
```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server only — never expose to browser

VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Optional: Better Auth / Kysely on same Postgres
# DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Vercel
Add the same keys under Project → Settings → Environment Variables, then **Redeploy**.

## 4. Behaviour
| Config | Bookings storage |
|--------|------------------|
| `SUPABASE_URL` + service/anon key | Supabase `bookings` table |
| else `DATABASE_URL` | Existing Postgres/PGLite path |
| else | In-memory / demo localStorage |

## 5. Security
- `SUPABASE_SERVICE_ROLE_KEY` must only live on the server (Vercel env, not `VITE_`)
- Server always filters by Better Auth `user_id`
- RLS policies protect direct client access when using Supabase Auth later
