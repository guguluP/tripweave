-- Partner catalog overrides, guest reviews, desk confirmation, and refunds of confirmed stays.
-- Applied on the TripWeave Supabase project. Re-run is safe.

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check
  check (status = any (array['paid','cancelled','pending','failed','held','completed','refunded','confirmed']));

create table if not exists public.property_overrides (
  package_id text primary key,
  price_per_night int,
  image_url text,
  extras jsonb not null default '[]'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.property_overrides enable row level security;

create table if not exists public.stay_reviews (
  id bigint generated always as identity primary key,
  user_id text not null,
  package_id text not null,
  booking_id bigint,
  rating int not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now(),
  unique (user_id, booking_id)
);
alter table public.stay_reviews enable row level security;
