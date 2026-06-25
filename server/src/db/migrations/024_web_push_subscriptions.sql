-- 024_web_push_subscriptions.sql
-- Browser/Web Push subscriptions for desktop and Android web app notifications.

create table if not exists web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_web_push_subscriptions_updated_at
before update on web_push_subscriptions
for each row execute function set_updated_at();

create index if not exists idx_web_push_subscriptions_workspace on web_push_subscriptions (workspace_id);
create index if not exists idx_web_push_subscriptions_user on web_push_subscriptions (user_id);
create index if not exists idx_web_push_subscriptions_status on web_push_subscriptions (status);
