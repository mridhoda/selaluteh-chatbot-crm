create or replace function set_modifier_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists modifier_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  code text not null check (char_length(trim(code)) between 1 and 120),
  type text not null default 'optional' check (type in ('optional', 'required')),
  selection_type text not null default 'single' check (selection_type in ('single', 'multi')),
  min_selection integer not null default 0 check (min_selection >= 0),
  max_selection integer not null default 1 check (max_selection >= min_selection),
  outlet_scope text not null default 'all_outlets' check (outlet_scope in ('all_outlets', 'selected_outlets')),
  description text null,
  tags text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table if not exists modifier_options (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  modifier_group_id uuid not null references modifier_groups(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  price_delta numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_modifier_groups (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  modifier_group_id uuid not null references modifier_groups(id) on delete cascade,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (workspace_id, product_id, modifier_group_id)
);

create index if not exists modifier_groups_workspace_status_idx on modifier_groups(workspace_id, status);
create index if not exists modifier_options_group_sort_idx on modifier_options(modifier_group_id, sort_order, created_at);
create index if not exists product_modifier_groups_product_idx on product_modifier_groups(workspace_id, product_id, sort_order);
create index if not exists product_modifier_groups_group_idx on product_modifier_groups(workspace_id, modifier_group_id);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'modifier_groups_updated_at') then
    create trigger modifier_groups_updated_at before update on modifier_groups for each row execute function set_modifier_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'modifier_options_updated_at') then
    create trigger modifier_options_updated_at before update on modifier_options for each row execute function set_modifier_updated_at();
  end if;
end $$;

alter table modifier_groups enable row level security;
alter table modifier_options enable row level security;
alter table product_modifier_groups enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'modifier_groups' and policyname = 'modifier_groups_service_role_all') then
    create policy "modifier_groups_service_role_all" on modifier_groups for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'modifier_options' and policyname = 'modifier_options_service_role_all') then
    create policy "modifier_options_service_role_all" on modifier_options for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'product_modifier_groups' and policyname = 'product_modifier_groups_service_role_all') then
    create policy "product_modifier_groups_service_role_all" on product_modifier_groups for all to service_role using (true) with check (true);
  end if;
end $$;
