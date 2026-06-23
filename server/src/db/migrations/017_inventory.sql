-- 017_inventory.sql
-- Task 18.2-18.3: Inventory items + stock movement ledger

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant text,
  quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  status text not null default 'active' check (status in ('active', 'discontinued', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_unique unique (workspace_id, outlet_id, product_id, coalesce(variant, ''))
);

create trigger set_inventory_items_updated_at
before update on inventory_items
for each row execute function set_updated_at();

create index if not exists inventory_items_workspace_id_idx on inventory_items(workspace_id);
create index if not exists inventory_items_outlet_id_idx on inventory_items(outlet_id);
create index if not exists inventory_items_product_id_idx on inventory_items(product_id);
create index if not exists inventory_items_status_idx on inventory_items(status);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant text,
  quantity_change integer not null,
  running_quantity integer not null,
  reason text not null check (reason in ('adjustment', 'reserve', 'release', 'consume', 'return', 'transfer_in', 'transfer_out', 'initial')),
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_workspace_id_idx on stock_movements(workspace_id);
create index if not exists stock_movements_outlet_id_idx on stock_movements(outlet_id);
create index if not exists stock_movements_product_id_idx on stock_movements(product_id);
create index if not exists stock_movements_reason_idx on stock_movements(reason);
create index if not exists stock_movements_reference_idx on stock_movements(reference_type, reference_id);
create index if not exists stock_movements_created_at_idx on stock_movements(created_at);
