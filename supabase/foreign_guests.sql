-- Foreign guests, phase 1: document the contract; no structural change.
-- Paste in the Supabase SQL editor after schema.sql. Safe to re-run.

comment on column public.travellers.phone is
  'E.164, e.g. +447911123456. Legacy rows may hold 10-digit Indian numbers until they expire.';
comment on column public.travellers.nationality is
  'ISO 3166-1 alpha-2, upper case.';
create index if not exists travellers_booking_nationality_idx
  on public.travellers (booking_id, nationality);

notify pgrst, 'reload schema';
