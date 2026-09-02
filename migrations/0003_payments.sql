alter table bookings add column if not exists payment_method text not null default 'card';
alter table bookings add column if not exists payment_ref text;
alter table bookings add column if not exists upi_handle text;
alter table bookings add column if not exists bank_name text;
