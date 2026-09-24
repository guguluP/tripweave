-- Better Auth identity for the live site.
-- Service role only. The browser anon key cannot read these rows.
-- Run in the Supabase SQL editor after schema.sql. Safe to re-run.

create table if not exists public.ba_user (
  id text primary key,
  name text not null,
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.ba_session (
  id text primary key,
  "expiresAt" timestamptz not null,
  token text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references public.ba_user (id) on delete cascade
);

create table if not exists public.ba_account (
  id text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references public.ba_user (id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.ba_verification (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists ba_session_user_idx on public.ba_session ("userId");
create index if not exists ba_account_user_idx on public.ba_account ("userId");
create index if not exists ba_verification_identifier_idx on public.ba_verification (identifier);

alter table public.ba_user enable row level security;
alter table public.ba_session enable row level security;
alter table public.ba_account enable row level security;
alter table public.ba_verification enable row level security;

revoke all on public.ba_user, public.ba_session, public.ba_account, public.ba_verification from public, anon, authenticated;
grant all on public.ba_user, public.ba_session, public.ba_account, public.ba_verification to service_role;
