-- Ask TripWeave thread and hourly cap for the local Postgres path.

create table if not exists ask_turns (
  id bigint generated always as identity primary key,
  user_id text not null,
  confirmation_code text not null,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create index if not exists ask_turns_user_code_idx
  on ask_turns (user_id, confirmation_code, created_at);

create table if not exists ask_hits (
  user_id text not null,
  asked_at timestamptz not null default now()
);

create index if not exists ask_hits_user_idx on ask_hits (user_id, asked_at);
