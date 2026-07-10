create table if not exists public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  code text,
  type text not null default 'optional' check (type in ('optional', 'required')),
  selection_type text not null default 'single' check (selection_type in ('single', 'multi')),
  min_selection integer not null default 0 check (min_selection >= 0),
  max_selection integer not null default 1 check (max_selection >= 0),
  outlet_scope text not null default 'all_outlets',
  description text,
  tags text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, code)
);

create table if not exists public.modifier_options (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_modifier_groups (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (workspace_id, product_id, modifier_group_id)
);

create index if not exists idx_modifier_groups_workspace_status on public.modifier_groups(workspace_id, status);
create index if not exists idx_modifier_options_group_sort on public.modifier_options(modifier_group_id, sort_order, created_at);
create index if not exists idx_product_modifier_groups_product on public.product_modifier_groups(workspace_id, product_id, sort_order);
create index if not exists idx_product_modifier_groups_group on public.product_modifier_groups(workspace_id, modifier_group_id);

create or replace function public.set_modifier_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_modifier_groups_updated_at on public.modifier_groups;
create trigger trg_modifier_groups_updated_at
before update on public.modifier_groups
for each row execute function public.set_modifier_updated_at();

drop trigger if exists trg_modifier_options_updated_at on public.modifier_options;
create trigger trg_modifier_options_updated_at
before update on public.modifier_options
for each row execute function public.set_modifier_updated_at();

alter table public.modifier_groups enable row level security;
alter table public.modifier_options enable row level security;
alter table public.product_modifier_groups enable row level security;

drop policy if exists "modifier groups workspace select" on public.modifier_groups;
create policy "modifier groups workspace select"
on public.modifier_groups for select
using (workspace_id = public.current_workspace_id());

drop policy if exists "modifier groups workspace insert" on public.modifier_groups;
create policy "modifier groups workspace insert"
on public.modifier_groups for insert
with check (workspace_id = public.current_workspace_id());

drop policy if exists "modifier groups workspace update" on public.modifier_groups;
create policy "modifier groups workspace update"
on public.modifier_groups for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

drop policy if exists "modifier groups workspace delete" on public.modifier_groups;
create policy "modifier groups workspace delete"
on public.modifier_groups for delete
using (workspace_id = public.current_workspace_id());

drop policy if exists "modifier options workspace select" on public.modifier_options;
create policy "modifier options workspace select"
on public.modifier_options for select
using (workspace_id = public.current_workspace_id());

drop policy if exists "modifier options workspace insert" on public.modifier_options;
create policy "modifier options workspace insert"
on public.modifier_options for insert
with check (workspace_id = public.current_workspace_id());

drop policy if exists "modifier options workspace update" on public.modifier_options;
create policy "modifier options workspace update"
on public.modifier_options for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

drop policy if exists "modifier options workspace delete" on public.modifier_options;
create policy "modifier options workspace delete"
on public.modifier_options for delete
using (workspace_id = public.current_workspace_id());

drop policy if exists "product modifier groups workspace select" on public.product_modifier_groups;
create policy "product modifier groups workspace select"
on public.product_modifier_groups for select
using (workspace_id = public.current_workspace_id());

drop policy if exists "product modifier groups workspace insert" on public.product_modifier_groups;
create policy "product modifier groups workspace insert"
on public.product_modifier_groups for insert
with check (workspace_id = public.current_workspace_id());

drop policy if exists "product modifier groups workspace update" on public.product_modifier_groups;
create policy "product modifier groups workspace update"
on public.product_modifier_groups for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

drop policy if exists "product modifier groups workspace delete" on public.product_modifier_groups;
create policy "product modifier groups workspace delete"
on public.product_modifier_groups for delete
using (workspace_id = public.current_workspace_id());
