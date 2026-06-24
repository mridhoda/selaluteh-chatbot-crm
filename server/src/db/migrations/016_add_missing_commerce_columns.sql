-- ============================================================
-- Migration: 016_add_missing_commerce_columns.sql
-- Deskripsi: Menambahkan kolom-kolom yang dibutuhkan untuk
--            fitur cart -> checkout -> order dari Telegram AI.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. TABEL: orders
--    Kolom outlet_name_snapshot belum ada di schema awal.
--    Dipakai untuk menyimpan nama outlet saat order dibuat.
-- ============================================================
alter table orders
  add column if not exists outlet_name_snapshot text not null default '';


-- ============================================================
-- 2. TABEL: carts
--    Tabel cart untuk menyimpan keranjang belanja aktif user.
-- ============================================================
create table if not exists carts (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  outlet_id       uuid null references outlets(id) on delete set null,
  contact_id      uuid null references contacts(id) on delete set null,
  chat_id         uuid null references chats(id) on delete set null,
  status          text not null default 'active'
                    check (status in ('active', 'converted', 'expired', 'abandoned')),
  total_amount    numeric(14,2) not null default 0 check (total_amount >= 0),
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  delivery_fee    numeric(14,2) not null default 0 check (delivery_fee >= 0),
  currency        text not null default 'IDR',
  expires_at      timestamptz null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_carts_updated_at'
  ) then
    create trigger set_carts_updated_at
      before update on carts
      for each row execute function set_updated_at();
  end if;
end $$;


-- ============================================================
-- 3. TABEL: cart_items
--    Item-item di dalam keranjang belanja.
-- ============================================================
create table if not exists cart_items (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  cart_id               uuid not null references carts(id) on delete cascade,
  product_id            uuid null references products(id) on delete set null,
  variant_id            uuid null references product_variants(id) on delete set null,
  product_name_snapshot text not null default '',
  variant_name_snapshot text null,
  unit_price            numeric(14,2) not null default 0 check (unit_price >= 0),
  quantity              integer not null default 1 check (quantity > 0),
  subtotal_amount       numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  notes                 text null,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_cart_items_updated_at'
  ) then
    create trigger set_cart_items_updated_at
      before update on cart_items
      for each row execute function set_updated_at();
  end if;
end $$;


-- ============================================================
-- 4. TABEL: checkouts
--    Data checkout sebelum order dibuat.
-- ============================================================
create table if not exists checkouts (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid not null references workspaces(id) on delete cascade,
  outlet_id            uuid null references outlets(id) on delete set null,
  cart_id              uuid null references carts(id) on delete set null,
  contact_id           uuid null references contacts(id) on delete set null,
  chat_id              uuid null references chats(id) on delete set null,
  status               text not null default 'pending'
                         check (status in ('pending', 'confirmed', 'converted', 'expired', 'cancelled')),
  idempotency_key      text null,
  subtotal_amount      numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  total_amount         numeric(14,2) not null default 0 check (total_amount >= 0),
  discount_amount      numeric(14,2) not null default 0 check (discount_amount >= 0),
  delivery_fee         numeric(14,2) not null default 0 check (delivery_fee >= 0),
  currency             text not null default 'IDR',
  customer_name        text null,
  customer_phone       text null,
  customer_address     text null,
  delivery_method      text null,
  customer_snapshot    jsonb not null default '{}'::jsonb,
  fulfillment_snapshot jsonb not null default '{}'::jsonb,
  notes                text null,
  expires_at           timestamptz null,
  metadata             jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint checkouts_idempotency_key_unique unique (idempotency_key)
);

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_checkouts_updated_at'
  ) then
    create trigger set_checkouts_updated_at
      before update on checkouts
      for each row execute function set_updated_at();
  end if;
end $$;


-- ============================================================
-- 5. TABEL: checkout_items
--    Item-item di dalam checkout.
-- ============================================================
create table if not exists checkout_items (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  checkout_id           uuid not null references checkouts(id) on delete cascade,
  product_id            uuid null references products(id) on delete set null,
  variant_id            uuid null references product_variants(id) on delete set null,
  product_name_snapshot text not null default '',
  variant_name_snapshot text null,
  unit_price            numeric(14,2) not null default 0 check (unit_price >= 0),
  quantity              integer not null default 1 check (quantity > 0),
  subtotal_amount       numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  notes                 text null,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_checkout_items_updated_at'
  ) then
    create trigger set_checkout_items_updated_at
      before update on checkout_items
      for each row execute function set_updated_at();
  end if;
end $$;


-- ============================================================
-- 6. KOLOM TAMBAHAN di tabel chats
--    current_outlet_id: outlet yang sedang dipilih oleh user
--    dalam percakapan AI. Di-update saat AI panggil select_outlet.
-- ============================================================
alter table chats
  add column if not exists current_outlet_id uuid null references outlets(id) on delete set null;


-- ============================================================
-- 7. INDEX untuk performa query
-- ============================================================

-- carts
create index if not exists idx_carts_workspace_contact_status
  on carts (workspace_id, contact_id, status);

create index if not exists idx_carts_workspace_chat_status
  on carts (workspace_id, chat_id, status);

create index if not exists idx_carts_workspace_outlet_status
  on carts (workspace_id, outlet_id, status);

create index if not exists idx_carts_expires_at
  on carts (expires_at) where status = 'active';

-- cart_items
create index if not exists idx_cart_items_cart_id
  on cart_items (cart_id);

create index if not exists idx_cart_items_workspace_product
  on cart_items (workspace_id, product_id);

-- checkouts
create index if not exists idx_checkouts_workspace_contact_status
  on checkouts (workspace_id, contact_id, status);

create index if not exists idx_checkouts_workspace_cart_status
  on checkouts (workspace_id, cart_id, status);

create index if not exists idx_checkouts_expires_at
  on checkouts (expires_at) where status in ('pending', 'confirmed');

-- checkout_items
create index if not exists idx_checkout_items_checkout_id
  on checkout_items (checkout_id);

-- orders (tambahan index untuk query AI & sidebar)
create index if not exists idx_orders_workspace_chat_id
  on orders (workspace_id, chat_id);

create index if not exists idx_orders_workspace_contact_id
  on orders (workspace_id, contact_id);


-- ============================================================
-- 8. RLS (Row Level Security)
--    Aktifkan untuk tabel baru, samakan pola dengan tabel lain.
-- ============================================================
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table checkouts enable row level security;
alter table checkout_items enable row level security;

-- Policy: service_role bisa akses semua (untuk server-side operations via supabase service key)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'carts' and policyname = 'carts_service_role_all') then
    create policy "carts_service_role_all" on carts for all to service_role using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cart_items' and policyname = 'cart_items_service_role_all') then
    create policy "cart_items_service_role_all" on cart_items for all to service_role using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'checkouts' and policyname = 'checkouts_service_role_all') then
    create policy "checkouts_service_role_all" on checkouts for all to service_role using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'checkout_items' and policyname = 'checkout_items_service_role_all') then
    create policy "checkout_items_service_role_all" on checkout_items for all to service_role using (true) with check (true);
  end if;
end $$;

-- ============================================================
-- SELESAI
-- ============================================================
-- Catatan: Jalankan di Supabase SQL Editor:
-- Dashboard -> project -> SQL Editor -> paste & Run
-- Semua statement menggunakan IF NOT EXISTS jadi aman
-- dijalankan berulang kali (idempotent).
-- ============================================================
