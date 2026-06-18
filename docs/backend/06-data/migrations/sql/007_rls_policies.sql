-- 007_rls_policies.sql
-- Draft Supabase Row Level Security policies for CRM + Telegram marketplace MVP.
--
-- Important:
-- - Public webhooks should use backend service role and must validate provider tokens/signatures.
-- - Service role bypasses RLS, so backend routes still must validate workspace ownership.
-- - These policies are intended for future Supabase Auth usage.

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.users
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.users
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_app_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where auth_user_id = auth.uid()
  limit 1
$$;

alter table workspaces enable row level security;
alter table users enable row level security;
alter table workspace_settings enable row level security;
alter table outlets enable row level security;
alter table user_workspace_memberships enable row level security;
alter table user_outlet_access enable row level security;
alter table platforms enable row level security;
alter table agents enable row level security;
alter table agent_outlets enable row level security;
alter table contacts enable row level security;
alter table chats enable row level security;
alter table chat_messages enable row level security;
alter table webhook_events enable row level security;
alter table ai_actions enable row level security;
alter table files enable row level security;
alter table product_categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_outlet_availability enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table checkouts enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table payment_provider_settings enable row level security;
alter table payments enable row level security;
alter table payment_attempts enable row level security;
alter table payment_events enable row level security;
alter table complaints enable row level security;


-- Workspaces and users
create policy "workspace members can read workspace"
on workspaces for select
using (id = public.current_workspace_id());

create policy "workspace owners can update workspace"
on workspaces for update
using (id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'))
with check (id = public.current_workspace_id());

create policy "workspace users read"
on users for select
using (workspace_id = public.current_workspace_id());

create policy "workspace owners manage users"
on users for all
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'))
with check (workspace_id = public.current_workspace_id());

-- Chat policy mirrors current owner/super vs human agent behavior.
create policy "chats workspace role read"
on chats for select
using (
  workspace_id = public.current_workspace_id()
  and (
    public.current_app_role() in ('owner', 'super')
    or taken_over_by_user_id = public.current_app_user_id()
  )
);

create policy "chats workspace insert"
on chats for insert
with check (workspace_id = public.current_workspace_id());

create policy "chats workspace update"
on chats for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "chats workspace delete owner super"
on chats for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

-- Product catalog can be readable by workspace users; customer-facing reads should go through backend.

create policy "workspace_settings workspace select"
on workspace_settings for select
using (workspace_id = public.current_workspace_id());

create policy "workspace_settings workspace insert"
on workspace_settings for insert
with check (workspace_id = public.current_workspace_id());

create policy "workspace_settings workspace update"
on workspace_settings for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "workspace_settings workspace delete"
on workspace_settings for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "outlets workspace select"
on outlets for select
using (workspace_id = public.current_workspace_id());

create policy "outlets workspace insert"
on outlets for insert
with check (workspace_id = public.current_workspace_id());

create policy "outlets workspace update"
on outlets for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "outlets workspace delete"
on outlets for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "user_workspace_memberships workspace select"
on user_workspace_memberships for select
using (workspace_id = public.current_workspace_id());

create policy "user_workspace_memberships workspace insert"
on user_workspace_memberships for insert
with check (workspace_id = public.current_workspace_id());

create policy "user_workspace_memberships workspace update"
on user_workspace_memberships for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "user_workspace_memberships workspace delete"
on user_workspace_memberships for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "user_outlet_access workspace select"
on user_outlet_access for select
using (workspace_id = public.current_workspace_id());

create policy "user_outlet_access workspace insert"
on user_outlet_access for insert
with check (workspace_id = public.current_workspace_id());

create policy "user_outlet_access workspace update"
on user_outlet_access for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "user_outlet_access workspace delete"
on user_outlet_access for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "platforms workspace select"
on platforms for select
using (workspace_id = public.current_workspace_id());

create policy "platforms workspace insert"
on platforms for insert
with check (workspace_id = public.current_workspace_id());

create policy "platforms workspace update"
on platforms for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "platforms workspace delete"
on platforms for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agents workspace select"
on agents for select
using (workspace_id = public.current_workspace_id());

create policy "agents workspace insert"
on agents for insert
with check (workspace_id = public.current_workspace_id());

create policy "agents workspace update"
on agents for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agents workspace delete"
on agents for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_outlets workspace select"
on agent_outlets for select
using (workspace_id = public.current_workspace_id());

create policy "agent_outlets workspace insert"
on agent_outlets for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_outlets workspace update"
on agent_outlets for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_outlets workspace delete"
on agent_outlets for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "contacts workspace select"
on contacts for select
using (workspace_id = public.current_workspace_id());

create policy "contacts workspace insert"
on contacts for insert
with check (workspace_id = public.current_workspace_id());

create policy "contacts workspace update"
on contacts for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "contacts workspace delete"
on contacts for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "chat_messages workspace select"
on chat_messages for select
using (workspace_id = public.current_workspace_id());

create policy "chat_messages workspace insert"
on chat_messages for insert
with check (workspace_id = public.current_workspace_id());

create policy "chat_messages workspace update"
on chat_messages for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "chat_messages workspace delete"
on chat_messages for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "webhook_events workspace select"
on webhook_events for select
using (workspace_id = public.current_workspace_id());

create policy "webhook_events workspace insert"
on webhook_events for insert
with check (workspace_id = public.current_workspace_id());

create policy "webhook_events workspace update"
on webhook_events for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "webhook_events workspace delete"
on webhook_events for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "ai_actions workspace select"
on ai_actions for select
using (workspace_id = public.current_workspace_id());

create policy "ai_actions workspace insert"
on ai_actions for insert
with check (workspace_id = public.current_workspace_id());

create policy "ai_actions workspace update"
on ai_actions for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "ai_actions workspace delete"
on ai_actions for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "files workspace select"
on files for select
using (workspace_id = public.current_workspace_id());

create policy "files workspace insert"
on files for insert
with check (workspace_id = public.current_workspace_id());

create policy "files workspace update"
on files for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "files workspace delete"
on files for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "product_categories workspace select"
on product_categories for select
using (workspace_id = public.current_workspace_id());

create policy "product_categories workspace insert"
on product_categories for insert
with check (workspace_id = public.current_workspace_id());

create policy "product_categories workspace update"
on product_categories for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "product_categories workspace delete"
on product_categories for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "products workspace select"
on products for select
using (workspace_id = public.current_workspace_id());

create policy "products workspace insert"
on products for insert
with check (workspace_id = public.current_workspace_id());

create policy "products workspace update"
on products for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "products workspace delete"
on products for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "product_variants workspace select"
on product_variants for select
using (workspace_id = public.current_workspace_id());

create policy "product_variants workspace insert"
on product_variants for insert
with check (workspace_id = public.current_workspace_id());

create policy "product_variants workspace update"
on product_variants for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "product_variants workspace delete"
on product_variants for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "product_outlet_availability workspace select"
on product_outlet_availability for select
using (workspace_id = public.current_workspace_id());

create policy "product_outlet_availability workspace insert"
on product_outlet_availability for insert
with check (workspace_id = public.current_workspace_id());

create policy "product_outlet_availability workspace update"
on product_outlet_availability for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "product_outlet_availability workspace delete"
on product_outlet_availability for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "carts workspace select"
on carts for select
using (workspace_id = public.current_workspace_id());

create policy "carts workspace insert"
on carts for insert
with check (workspace_id = public.current_workspace_id());

create policy "carts workspace update"
on carts for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "carts workspace delete"
on carts for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "cart_items workspace select"
on cart_items for select
using (workspace_id = public.current_workspace_id());

create policy "cart_items workspace insert"
on cart_items for insert
with check (workspace_id = public.current_workspace_id());

create policy "cart_items workspace update"
on cart_items for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "cart_items workspace delete"
on cart_items for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "checkouts workspace select"
on checkouts for select
using (workspace_id = public.current_workspace_id());

create policy "checkouts workspace insert"
on checkouts for insert
with check (workspace_id = public.current_workspace_id());

create policy "checkouts workspace update"
on checkouts for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "checkouts workspace delete"
on checkouts for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "orders workspace select"
on orders for select
using (workspace_id = public.current_workspace_id());

create policy "orders workspace insert"
on orders for insert
with check (workspace_id = public.current_workspace_id());

create policy "orders workspace update"
on orders for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "orders workspace delete"
on orders for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "order_items workspace select"
on order_items for select
using (workspace_id = public.current_workspace_id());

create policy "order_items workspace insert"
on order_items for insert
with check (workspace_id = public.current_workspace_id());

create policy "order_items workspace update"
on order_items for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "order_items workspace delete"
on order_items for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "order_events workspace select"
on order_events for select
using (workspace_id = public.current_workspace_id());

create policy "order_events workspace insert"
on order_events for insert
with check (workspace_id = public.current_workspace_id());

create policy "order_events workspace update"
on order_events for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "order_events workspace delete"
on order_events for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "payment_provider_settings workspace select"
on payment_provider_settings for select
using (workspace_id = public.current_workspace_id());

create policy "payment_provider_settings workspace insert"
on payment_provider_settings for insert
with check (workspace_id = public.current_workspace_id());

create policy "payment_provider_settings workspace update"
on payment_provider_settings for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "payment_provider_settings workspace delete"
on payment_provider_settings for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "payments workspace select"
on payments for select
using (workspace_id = public.current_workspace_id());

create policy "payments workspace insert"
on payments for insert
with check (workspace_id = public.current_workspace_id());

create policy "payments workspace update"
on payments for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "payments workspace delete"
on payments for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "payment_attempts workspace select"
on payment_attempts for select
using (workspace_id = public.current_workspace_id());

create policy "payment_attempts workspace insert"
on payment_attempts for insert
with check (workspace_id = public.current_workspace_id());

create policy "payment_attempts workspace update"
on payment_attempts for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "payment_attempts workspace delete"
on payment_attempts for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "payment_events workspace select"
on payment_events for select
using (workspace_id = public.current_workspace_id());

create policy "payment_events workspace insert"
on payment_events for insert
with check (workspace_id = public.current_workspace_id());

create policy "payment_events workspace update"
on payment_events for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "payment_events workspace delete"
on payment_events for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "complaints workspace select"
on complaints for select
using (workspace_id = public.current_workspace_id());

create policy "complaints workspace insert"
on complaints for insert
with check (workspace_id = public.current_workspace_id());

create policy "complaints workspace update"
on complaints for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "complaints workspace delete"
on complaints for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));
