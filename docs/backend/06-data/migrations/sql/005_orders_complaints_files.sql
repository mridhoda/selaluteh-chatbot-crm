-- 005_orders_complaints_files.sql
-- Files, operations, marketplace catalog, carts, checkouts, orders, and payments.
--
-- This file intentionally expands the old operations schema into the latest
-- Telegram-first Marketplace MVP schema.

-- -----------------------------------------------------------------------------
-- Local file metadata. Binaries stay in server/uploads or another local disk.
-- -----------------------------------------------------------------------------
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  storage_provider text not null default 'local',
  disk text not null default 'uploads',
  relative_path text not null,
  public_path text null,
  original_name text null,
  stored_name text not null,
  mime_type text null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),
  source file_source not null default 'crm_upload',
  created_by uuid null references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint files_disk_relative_path_unique unique (disk, relative_path)
);

-- Add FK that could not be created in 004 because files did not exist yet.
do $$ begin
  alter table messages
    add constraint messages_attachment_file_fk
    foreign key (attachment_file_id) references files(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table agent_database_files
    add constraint agent_database_files_file_fk
    foreign key (file_id) references files(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Marketplace catalog
-- -----------------------------------------------------------------------------
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  parent_id uuid null references product_categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text null,
  image_file_id uuid null references files(id) on delete set null,
  is_active boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_workspace_slug_unique unique (workspace_id, slug)
);
create trigger set_product_categories_updated_at before update on product_categories for each row execute function set_updated_at();

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category_id uuid null references product_categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text null,
  short_description text null,
  sku text null,
  product_type product_type not null default 'physical',
  status product_status not null default 'active',
  base_price numeric(14,2) not null default 0 check (base_price >= 0),
  currency text not null default 'IDR',
  inventory_policy inventory_policy not null default 'do_not_track',
  stock_quantity integer null check (stock_quantity is null or stock_quantity >= 0),
  low_stock_threshold integer null check (low_stock_threshold is null or low_stock_threshold >= 0),
  primary_image_file_id uuid null references files(id) on delete set null,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  ai_search_text text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_workspace_slug_unique unique (workspace_id, slug),
  constraint products_workspace_sku_unique unique (workspace_id, sku)
);
create trigger set_products_updated_at before update on products for each row execute function set_updated_at();

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku text null,
  option_values jsonb not null default '{}'::jsonb,
  price numeric(14,2) null check (price is null or price >= 0),
  currency text not null default 'IDR',
  inventory_policy inventory_policy not null default 'do_not_track',
  stock_quantity integer null check (stock_quantity is null or stock_quantity >= 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_workspace_sku_unique unique (workspace_id, sku)
);
create trigger set_product_variants_updated_at before update on product_variants for each row execute function set_updated_at();

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  alt_text text null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Cart / checkout
-- -----------------------------------------------------------------------------
create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  chat_id uuid null references chats(id) on delete set null,
  platform_id uuid null references platforms(id) on delete set null,
  platform_type platform_type not null,
  status cart_status not null default 'active',
  currency text not null default 'IDR',
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  shipping_amount numeric(14,2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_carts_updated_at before update on carts for each row execute function set_updated_at();

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid null references product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  currency text not null default 'IDR',
  line_total numeric(14,2) not null check (line_total >= 0),
  product_snapshot jsonb not null default '{}'::jsonb,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_unique_product_variant unique (cart_id, product_id, variant_id)
);
create trigger set_cart_items_updated_at before update on cart_items for each row execute function set_updated_at();

create table if not exists checkouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  cart_id uuid not null references carts(id) on delete cascade,
  chat_id uuid null references chats(id) on delete set null,
  contact_id uuid not null references contacts(id) on delete cascade,
  status checkout_status not null default 'draft',
  customer_name text null,
  customer_phone text null,
  customer_address text null,
  delivery_method text null,
  notes text null,
  confirmed_at timestamptz null,
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_checkouts_updated_at before update on checkouts for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Orders and order items
-- -----------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_number text not null default generate_order_number('ORD'),
  source order_source not null default 'telegram',
  platform_id uuid null references platforms(id) on delete set null,
  platform_type platform_type null,
  chat_id uuid null references chats(id) on delete set null,
  contact_id uuid null references contacts(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  cart_id uuid null references carts(id) on delete set null,
  checkout_id uuid null references checkouts(id) on delete set null,
  form_name text null,               -- legacy AI sales form compatibility
  form_data jsonb not null default '{}'::jsonb,
  status order_status not null default 'pending_payment',
  payment_status payment_status not null default 'pending',
  currency text not null default 'IDR',
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  shipping_amount numeric(14,2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  customer_name text null,
  customer_phone text null,
  customer_address text null,
  notes text null,
  payment_proof_file_id uuid null references files(id) on delete set null,
  payment_proof_url text null,
  paid_at timestamptz null,
  completed_at timestamptz null,
  cancelled_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_workspace_order_number_unique unique (workspace_id, order_number)
);
create trigger set_orders_updated_at before update on orders for each row execute function set_updated_at();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid null references products(id) on delete set null,
  variant_id uuid null references product_variants(id) on delete set null,
  product_name text not null,
  variant_name text null,
  sku text null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  currency text not null default 'IDR',
  line_total numeric(14,2) not null check (line_total >= 0),
  product_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Payments
-- -----------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  provider payment_provider not null default 'midtrans',
  provider_order_id text not null,
  provider_transaction_id text null,
  provider_payment_type text null,
  status payment_status not null default 'pending',
  currency text not null default 'IDR',
  amount numeric(14,2) not null check (amount >= 0),
  payment_link_url text null,
  snap_token text null,
  raw_response jsonb not null default '{}'::jsonb,
  expires_at timestamptz null,
  paid_at timestamptz null,
  cancelled_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_order_unique unique (workspace_id, provider, provider_order_id)
);
create trigger set_payments_updated_at before update on payments for each row execute function set_updated_at();

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid null references payments(id) on delete set null,
  order_id uuid null references orders(id) on delete set null,
  provider payment_provider not null,
  event_type text not null,
  external_event_id text null,
  provider_order_id text null,
  provider_transaction_id text null,
  status payment_status null,
  signature_verified boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz null,
  error text null,
  created_at timestamptz not null default now(),
  constraint payment_events_external_unique unique (provider, external_event_id)
);

-- -----------------------------------------------------------------------------
-- Complaints
-- -----------------------------------------------------------------------------
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid null references chats(id) on delete set null,
  contact_id uuid null references contacts(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  platform_type platform_type null,
  text text not null default '',
  form_data jsonb not null default '{}'::jsonb,
  status complaint_status not null default 'open',
  assigned_to uuid null references users(id) on delete set null,
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_complaints_updated_at before update on complaints for each row execute function set_updated_at();

-- Separate workspace knowledge file metadata retained for migration compatibility.
create table if not exists knowledge_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  file_id uuid null references files(id) on delete set null,
  original_name text not null,
  stored_name text not null,
  mime_type text null,
  size_bytes bigint null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
