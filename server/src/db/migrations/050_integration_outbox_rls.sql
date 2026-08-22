-- 050_integration_outbox_rls.sql
-- 049_integration_outbox.sql omitted RLS entirely -- caught live when
-- applying it via the Supabase SQL editor's "creates a table without RLS"
-- warning, not before. integration_outbox holds order-linked event
-- payloads (customer name/phone, totals) and must not be reachable via
-- anon/authenticated keys. Only server/src/db/repositories/
-- integration-outbox.supabase.repository.js touches this table, always via
-- the service-role client -- same pattern as 047_product_modifiers.sql's
-- modifier_groups/modifier_options (RLS enabled + explicit service_role
-- policy; no anon/authenticated policy at all, so both are denied by
-- Postgres RLS's default-deny for any role with no matching policy).

alter table integration_outbox enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'integration_outbox' and policyname = 'integration_outbox_service_role_all') then
    create policy "integration_outbox_service_role_all" on integration_outbox for all to service_role using (true) with check (true);
  end if;
end $$;
