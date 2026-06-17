-- 005_orders_complaints_files.sql
-- Files, marketplace catalog, carts, checkouts, orders, payments, and complaints.

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

do $$ begin
  alter table chat_messages
    add constraint chat_messages_attachment_file_fk
    foreign key (attachment_file_id) references files(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  status product_category_status not null default 'active',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_workspace_slug_unique unique (workspace_id, slug)
);

create trigger set_product_categories_updated_at
before update on product_categories
for each row execute function set_updated_at();

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category_id uuid null references product_categories(id) on delete set null,
  name text not null,
  slug text null,
  sku text null,
  short_description text null,
  description text null,
  base_price numeric(14,2) not null default 0 check (base_price >= 0),
  cost_price numeric(14,2) null check (cost_price is null or cost_price >= 0),
  currency text not null default 'IDR',
  thumbnail_file_id uuid null references files(id) on delete set null,
  thumbnail_url text null,
  tags text[] not null default '{}',
  tax_rate numeric(8,4) null,
  tax_label text null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  stock_tracking boolean not null default false,
  stock_quantity integer null check (stock_quantity is null or stock_quantity >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_products_updated_at
before update on products
for each row execute function set_updated_at();

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku text null,
  price_delta numeric(14,2) not null default 0,
  final_price numeric(14,2) null check (final_price is null or final_price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_product_variants_updated_at
before update on product_variants
for each row execute function set_updated_at();

create table if not exists product_outlet_availability (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid null references product_variants(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  is_available boolean not null default true,
  price_override numeric(14,2) null check (price_override is null or price_override >= 0),
  stock_quantity integer null check (stock_quantity is null or stock_quantity >= 0),
  status text not null default 'active',
  available_from timestamptz null,
  available_until timestamptz null,
  sold_out_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_product_outlet_availability_updated_at
before update on product_outlet_availability
for each row execute function set_updated_at();

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  contact_id uuid null references contacts(id) on delete cascade,
  chat_id uuid null references chats(id) on delete set null,
  platform_id uuid null references platforms(id) on delete set null,
  status cart_status not null default 'active',
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'IDR',
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_carts_updated_at
before update on carts
for each row execute function set_updated_at();

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid null references product_variants(id) on delete restrict,
  product_name_snapshot text not null,
  variant_name_snapshot text null,
  base_price numeric(14,2) null check (base_price is null or base_price >= 0),
  effective_price numeric(14,2) null check (effective_price is null or effective_price >= 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_amount numeric(14,2) not null check (subtotal_amount >= 0),
  modifiers jsonb not null default '[]'::jsonb,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_cart_items_updated_at
before update on cart_items
for each row execute function set_updated_at();

create table if not exists checkouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  cart_id uuid null references carts(id) on delete set null,
  chat_id uuid null references chats(id) on delete set null,
  contact_id uuid null references contacts(id) on delete set null,
  status checkout_status not null default 'pending',
  idempotency_key text null,
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'IDR',
  customer_name text null,
  customer_phone text null,
  customer_address text null,
  delivery_method text null,
  customer_snapshot jsonb not null default '{}'::jsonb,
  fulfillment_snapshot jsonb not null default '{}'::jsonb,
  notes text null,
  confirmed_at timestamptz null,
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_checkouts_updated_at
before update on checkouts
for each row execute function set_updated_at();

create table if not exists checkout_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  checkout_id uuid not null references checkouts(id) on delete cascade,
  product_id uuid null references products(id) on delete set null,
  variant_id uuid null references product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_amount numeric(14,2) not null check (subtotal_amount >= 0),
  modifiers jsonb not null default '[]'::jsonb,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_checkout_items_updated_at
before update on checkout_items
for each row execute function set_updated_at();

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  chat_id uuid null references chats(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  cart_id uuid null references carts(id) on delete set null,
  checkout_id uuid null references checkouts(id) on delete set null,
  order_number text not null default generate_order_number('ORD'),
  source order_source not null default 'telegram',
  status order_status not null default 'new',
  payment_status order_payment_status not null default 'unpaid',
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  customer_name_snapshot text not null default '',
  customer_phone_snapshot text null,
  channel_snapshot text null,
  customer_snapshot jsonb not null default '{}'::jsonb,
  fulfillment_snapshot jsonb not null default '{}'::jsonb,
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'IDR',
  payment_method text null,
  notes text null,
  form_data jsonb not null default '{}'::jsonb,
  payment_proof_file_id uuid null references files(id) on delete set null,
  paid_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_orders_updated_at
before update on orders
for each row execute function set_updated_at();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid null references products(id) on delete set null,
  variant_id uuid null references product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_amount numeric(14,2) not null check (subtotal_amount >= 0),
  modifiers jsonb not null default '[]'::jsonb,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_order_items_updated_at
before update on order_items
for each row execute function set_updated_at();

create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  event_type text not null,
  label text not null,
  actor_type text not null default 'system',
  actor_user_id uuid null references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists payment_provider_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider payment_provider not null,
  environment payment_provider_environment not null default 'sandbox',
  merchant_id text null,
  public_key text null,
  server_key_encrypted text null,
  webhook_secret_encrypted text null,
  enabled_methods jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_provider_settings_unique unique (workspace_id, provider)
);

create trigger set_payment_provider_settings_updated_at
before update on payment_provider_settings
for each row execute function set_updated_at();

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  provider payment_provider not null default 'midtrans',
  method text null,
  payment_method text null,
  status payment_record_status not null default 'pending',
  reconciliation_status reconciliation_status not null default 'unmatched',
  attempt_number integer not null default 1 check (attempt_number > 0),
  amount numeric(14,2) not null check (amount >= 0),
  gross_amount numeric(14,2) not null default 0 check (gross_amount >= 0),
  provider_fee numeric(14,2) null check (provider_fee is null or provider_fee >= 0),
  net_amount numeric(14,2) null check (net_amount is null or net_amount >= 0),
  currency text not null default 'IDR',
  payment_link text null,
  payment_url text null,
  provider_ref text null,
  provider_transaction_id text null,
  merchant_reference text null,
  customer_snapshot jsonb not null default '{}'::jsonb,
  expires_at timestamptz null,
  paid_at timestamptz null,
  matched_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_payments_updated_at
before update on payments
for each row execute function set_updated_at();

create table if not exists payment_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status payment_record_status not null default 'pending',
  method text null,
  payment_method text null,
  provider_ref text null,
  provider_transaction_id text null,
  payment_link text null,
  payment_url text null,
  gross_amount numeric(14,2) null check (gross_amount is null or gross_amount >= 0),
  customer_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expired_at timestamptz null,
  paid_at timestamptz null
);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid null references payments(id) on delete cascade,
  order_id uuid null references orders(id) on delete cascade,
  provider text null,
  provider_event_id text null,
  event_type text null,
  status text null,
  processing_status payment_event_processing_status not null default 'received',
  verification_result text null,
  amount numeric(14,2) null check (amount is null or amount >= 0),
  currency text not null default 'IDR',
  fee_amount numeric(14,2) null check (fee_amount is null or fee_amount >= 0),
  net_amount numeric(14,2) null check (net_amount is null or net_amount >= 0),
  payment_method text null,
  raw_payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_payment_events_updated_at
before update on payment_events
for each row execute function set_updated_at();

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid null references outlets(id) on delete set null,
  contact_id uuid null references contacts(id) on delete set null,
  chat_id uuid null references chats(id) on delete set null,
  platform_id uuid null references platforms(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  channel platform_type null,
  subject text not null default '',
  description text null,
  status complaint_status not null default 'open',
  priority complaint_priority not null default 'medium',
  assigned_to_user_id uuid null references users(id) on delete set null,
  resolution_notes text null,
  form_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_complaints_updated_at
before update on complaints
for each row execute function set_updated_at();
