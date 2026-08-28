create table if not exists bookings (
  id serial primary key,
  user_id text not null,
  package_id text not null,
  package_name text not null,
  nights integer not null,
  travelers integer not null,
  check_in date not null,
  amount_inr integer not null,
  swaps text not null default '{}',
  status text not null default 'paid',
  card_last4 text,
  card_brand text,
  payer_name text not null,
  confirmation_code text not null,
  created_at timestamptz not null default now()
);

create index if not exists bookings_user_id_idx on bookings (user_id);
create unique index if not exists bookings_confirmation_code_idx on bookings (confirmation_code);
