-- 009_multi_workspace_outlet_foundation.sql
-- Review against existing schema before running.

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  code text,
  address text,
  phone text,
  status text not null default 'active',
  timezone text default 'Asia/Makassar',
  opening_hours jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, code)
);

create table if not exists user_workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create table if not exists user_outlet_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'outlet_viewer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, outlet_id, user_id)
);

create table if not exists product_outlet_availability (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  is_available boolean not null default true,
  price_override integer,
  stock_quantity integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, product_id, outlet_id)
);

alter table carts add column if not exists outlet_id uuid references outlets(id);
alter table checkouts add column if not exists outlet_id uuid references outlets(id);
alter table orders add column if not exists outlet_id uuid references outlets(id);
alter table payments add column if not exists outlet_id uuid references outlets(id);
alter table complaints add column if not exists outlet_id uuid references outlets(id);
alter table chats add column if not exists current_outlet_id uuid references outlets(id);

create index if not exists idx_outlets_workspace_id on outlets(workspace_id);
create index if not exists idx_user_workspace_memberships_user on user_workspace_memberships(user_id);
create index if not exists idx_user_workspace_memberships_workspace on user_workspace_memberships(workspace_id);
create index if not exists idx_user_outlet_access_user_workspace on user_outlet_access(user_id, workspace_id);
create index if not exists idx_user_outlet_access_outlet on user_outlet_access(outlet_id);
create index if not exists idx_product_outlet_availability_workspace_outlet on product_outlet_availability(workspace_id, outlet_id);
create index if not exists idx_product_outlet_availability_product on product_outlet_availability(product_id);
create index if not exists idx_orders_workspace_outlet_created on orders(workspace_id, outlet_id, created_at desc);
create index if not exists idx_payments_workspace_outlet_created on payments(workspace_id, outlet_id, created_at desc);
