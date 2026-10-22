-- Foreign guests, phase 1. Neon / PGlite mirror of supabase/foreign_guests.sql.
-- Comments and an index only. Legacy 10-digit rows expire with the guest record.

comment on column stay_guests.phone is 'E.164; legacy 10-digit rows expire.';
comment on column stay_guests.nationality is 'ISO 3166-1 alpha-2.';
create index if not exists stay_guests_booking_nationality_idx
  on stay_guests (booking_id, nationality);
