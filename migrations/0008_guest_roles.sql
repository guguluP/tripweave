-- Lead vs companion, and an age band for companions.
-- Additive. Existing rows stay is_lead = false until a new save marks the lead.

alter table stay_guests add column if not exists is_lead boolean not null default false;
alter table stay_guests add column if not exists age_band text;
