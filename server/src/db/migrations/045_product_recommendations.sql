-- 045_product_recommendations.sql
-- Rule-based upsell/cross-sell rules and best-effort storefront tracking.

create table if not exists product_recommendations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  source_product_id uuid not null references products(id) on delete restrict,
  target_product_id uuid not null references products(id) on delete restrict,
  outlet_id uuid null references outlets(id) on delete set null,
  recommendation_type text not null check (recommendation_type in ('upsell', 'cross_sell')),
  placement text not null default 'cart' check (placement in ('cart')),
  headline text null,
  priority integer not null default 0 check (priority between -1000 and 1000),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  starts_at timestamptz null,
  ends_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_recommendations_distinct_products check (source_product_id <> target_product_id),
  constraint product_recommendations_schedule_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists recommendation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  recommendation_id uuid null references product_recommendations(id) on delete set null,
  source_product_id uuid null references products(id) on delete set null,
  target_product_id uuid not null references products(id) on delete restrict,
  outlet_id uuid null references outlets(id) on delete set null,
  cart_id uuid null references carts(id) on delete set null,
  order_id uuid null references orders(id) on delete set null,
  session_id text null,
  event_type text not null check (event_type in ('impression', 'clicked', 'accepted', 'dismissed', 'purchased')),
  placement text not null check (placement in ('cart')),
  idempotency_key text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists product_recommendations_global_unique_idx
  on product_recommendations(workspace_id, source_product_id, target_product_id, placement)
  where outlet_id is null;

create unique index if not exists product_recommendations_outlet_unique_idx
  on product_recommendations(workspace_id, source_product_id, target_product_id, placement, outlet_id)
  where outlet_id is not null;

create unique index if not exists recommendation_events_idempotency_unique_idx
  on recommendation_events(workspace_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists product_recommendations_lookup_idx
  on product_recommendations(workspace_id, source_product_id, placement, status, outlet_id, priority desc);
create index if not exists product_recommendations_schedule_idx
  on product_recommendations(workspace_id, starts_at, ends_at);
create index if not exists recommendation_events_workspace_date_idx
  on recommendation_events(workspace_id, created_at desc);
create index if not exists recommendation_events_rule_type_date_idx
  on recommendation_events(workspace_id, recommendation_id, event_type, created_at desc);
create index if not exists recommendation_events_cart_order_idx
  on recommendation_events(workspace_id, cart_id, order_id, created_at desc);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_product_recommendations_updated_at') then
    create trigger set_product_recommendations_updated_at
      before update on product_recommendations for each row execute function set_updated_at();
  end if;
end $$;

alter table product_recommendations enable row level security;
alter table recommendation_events enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'product_recommendations' and policyname = 'product_recommendations_service_role_all') then
    create policy "product_recommendations_service_role_all" on product_recommendations
      for all to service_role using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'recommendation_events' and policyname = 'recommendation_events_service_role_all') then
    create policy "recommendation_events_service_role_all" on recommendation_events
      for all to service_role using (true) with check (true);
  end if;
end $$;
