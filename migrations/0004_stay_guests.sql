-- Short-lived guest records for a stay. Full ID numbers are never stored.
-- expires_at is check-out + 14 days; purge where expires_at < now().

create table if not exists stay_guests (
  id serial primary key,
  user_id text not null,
  booking_id integer references bookings (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  nationality text,
  id_type text,
  id_last4 text,
  emergency_name text,
  emergency_phone text,
  digiyatra_status text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists stay_guests_user_id_idx on stay_guests (user_id);
create index if not exists stay_guests_expires_at_idx on stay_guests (expires_at);
