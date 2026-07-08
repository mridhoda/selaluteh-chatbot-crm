-- 043_universal_qr_scope.sql
-- Additive Universal QR support. This relaxes QR outlet/session locks while
-- preserving hashed QR token storage and canonical runtime table names.

alter table if exists qr_codes
  alter column outlet_id drop not null,
  add column if not exists scope text not null default 'outlet',
  add column if not exists qr_type text not null default 'outlet';

do $$
begin
  if to_regclass('public.qr_codes') is not null then
    update qr_codes
    set
      scope = case
        when qr_location_id is not null then 'location'
        when outlet_id is null then 'universal'
        else 'outlet'
      end,
      qr_type = case
        when qr_location_id is not null then 'location'
        when outlet_id is null then 'universal'
        else 'outlet'
      end
    where scope is distinct from case
        when qr_location_id is not null then 'location'
        when outlet_id is null then 'universal'
        else 'outlet'
      end
      or qr_type is distinct from case
        when qr_location_id is not null then 'location'
        when outlet_id is null then 'universal'
        else 'outlet'
      end;
  end if;
end $$;

do $$
begin
  if to_regclass('public.qr_codes') is not null then
    if not exists (select 1 from pg_constraint where conname = 'qr_codes_scope_check') then
      alter table qr_codes add constraint qr_codes_scope_check
        check (scope in ('universal', 'outlet', 'location')) not valid;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'qr_codes_qr_type_check') then
      alter table qr_codes add constraint qr_codes_qr_type_check
        check (qr_type in ('universal', 'outlet', 'location')) not valid;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'qr_codes_scope_qr_type_match_check') then
      alter table qr_codes add constraint qr_codes_scope_qr_type_match_check
        check (scope = qr_type) not valid;
    end if;

    if not exists (select 1 from pg_constraint where conname = 'qr_codes_scope_target_consistency_check') then
      alter table qr_codes add constraint qr_codes_scope_target_consistency_check
        check (
          (scope = 'universal' and outlet_id is null and qr_location_id is null)
          or (scope = 'outlet' and outlet_id is not null and qr_location_id is null)
          or (scope = 'location' and outlet_id is not null and qr_location_id is not null)
        ) not valid;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.qr_codes') is not null then
    execute 'create index if not exists qr_codes_workspace_scope_status_idx on qr_codes(workspace_id, scope, status)';
    execute 'create index if not exists qr_codes_workspace_qr_type_status_idx on qr_codes(workspace_id, qr_type, status)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.qr_order_sessions') is not null then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'qr_order_sessions'
        and column_name = 'outlet_id'
        and is_nullable = 'NO'
    ) then
      alter table qr_order_sessions alter column outlet_id drop not null;
    end if;

    alter table qr_order_sessions
      add column if not exists selected_outlet_id uuid null references outlets(id) on delete set null,
      add column if not exists locked_outlet_id uuid null references outlets(id) on delete set null,
      add column if not exists locked_location_id uuid null references qr_locations(id) on delete set null,
      add column if not exists customer_context jsonb not null default '{}'::jsonb;
  end if;
end $$;
