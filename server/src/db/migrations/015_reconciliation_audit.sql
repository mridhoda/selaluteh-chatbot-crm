-- 015_reconciliation_audit.sql
-- Task 16.8: Reconciliation audit log

create table if not exists reconciliation_audit (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  old_status text not null,
  new_status text not null,
  provider_status text,
  order_id uuid references orders(id) on delete set null,
  order_number text,
  auditor text not null default 'system',
  audited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_reconciliation_audit_updated_at
before update on reconciliation_audit
for each row execute function set_updated_at();

create index if not exists reconciliation_audit_workspace_id_idx on reconciliation_audit(workspace_id);
create index if not exists reconciliation_audit_payment_id_idx on reconciliation_audit(payment_id);
create index if not exists reconciliation_audit_order_id_idx on reconciliation_audit(order_id);
create index if not exists reconciliation_audit_audited_at_idx on reconciliation_audit(audited_at);
create index if not exists reconciliation_audit_old_status_idx on reconciliation_audit(old_status);
create index if not exists reconciliation_audit_new_status_idx on reconciliation_audit(new_status);