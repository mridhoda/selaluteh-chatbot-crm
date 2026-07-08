-- 039_online_qr_store_phase31_hardening.sql
-- Phase 3.1 additive hardening for Online Store + QR Store runtime mappings.
-- Keeps runtime table names canonical and avoids storing raw QR tokens or plaintext secrets.

alter table if exists qr_locations
  add column if not exists sort_order integer not null default 0;

alter table if exists qr_codes
  add column if not exists outlet_locked boolean not null default true,
  add column if not exists revoked_reason text null,
  add column if not exists created_by uuid null references users(id) on delete set null;

create index if not exists qr_locations_outlet_sort_idx
  on qr_locations(outlet_id, status, sort_order);

create index if not exists qr_codes_public_code_status_idx
  on qr_codes(public_code, status);

create index if not exists qr_codes_token_hash_status_idx
  on qr_codes(qr_token_hash, status);

create index if not exists qr_codes_created_by_idx
  on qr_codes(created_by)
  where created_by is not null;

create index if not exists qr_order_sessions_status_expires_idx
  on qr_order_sessions(session_status, expires_at)
  where session_status is not null;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'qr_locations'
  ) then
    update qr_locations
    set location_type = case location_type
      when 'pickup' then 'pickup_area'
      when 'area' then 'general_store'
      when 'room' then 'general_store'
      when 'other' then 'general_store'
      else location_type
    end
    where location_type in ('pickup', 'area', 'room', 'other');

    alter table qr_locations drop constraint if exists qr_locations_location_type_check;
    alter table qr_locations add constraint qr_locations_location_type_check
      check (location_type in ('table', 'counter', 'pickup_area', 'takeaway_area', 'general_store'));
    alter table qr_locations alter column location_type set default 'pickup_area';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'qr_order_sessions'
      and column_name = 'session_status'
  ) then
    if not exists (
      select 1
      from qr_order_sessions
      where session_status is not null
        and session_status not in ('active', 'expired', 'completed', 'cancelled')
    ) then
      alter table qr_order_sessions drop constraint if exists qr_order_sessions_session_status_check;
      alter table qr_order_sessions add constraint qr_order_sessions_session_status_check
        check (session_status in ('active', 'expired', 'completed', 'cancelled'));
    end if;
  end if;
end $$;
