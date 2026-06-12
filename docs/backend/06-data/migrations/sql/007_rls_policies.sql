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
alter table settings enable row level security;
alter table platforms enable row level security;
alter table agents enable row level security;
alter table agent_knowledge enable row level security;
alter table agent_followups enable row level security;
alter table agent_database_files enable row level security;
alter table agent_complaint_fields enable row level security;
alter table agent_outlets enable row level security;
alter table agent_products enable row level security;
alter table agent_sales_forms enable row level security;
alter table agent_sales_form_fields enable row level security;
alter table agent_sales_form_products enable row level security;
alter table contacts enable row level security;
alter table messages enable row level security;
alter table webhook_events enable row level security;
alter table ai_actions enable row level security;
alter table files enable row level security;
alter table product_categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table checkouts enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table payment_events enable row level security;
alter table complaints enable row level security;
alter table knowledge_files enable row level security;


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
    or takeover_by = public.current_app_user_id()
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

create policy "settings workspace select"
on settings for select
using (workspace_id = public.current_workspace_id());

create policy "settings workspace insert"
on settings for insert
with check (workspace_id = public.current_workspace_id());

create policy "settings workspace update"
on settings for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "settings workspace delete"
on settings for delete
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

create policy "agent_knowledge workspace select"
on agent_knowledge for select
using (workspace_id = public.current_workspace_id());

create policy "agent_knowledge workspace insert"
on agent_knowledge for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_knowledge workspace update"
on agent_knowledge for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_knowledge workspace delete"
on agent_knowledge for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_followups workspace select"
on agent_followups for select
using (workspace_id = public.current_workspace_id());

create policy "agent_followups workspace insert"
on agent_followups for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_followups workspace update"
on agent_followups for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_followups workspace delete"
on agent_followups for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_database_files workspace select"
on agent_database_files for select
using (workspace_id = public.current_workspace_id());

create policy "agent_database_files workspace insert"
on agent_database_files for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_database_files workspace update"
on agent_database_files for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_database_files workspace delete"
on agent_database_files for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_complaint_fields workspace select"
on agent_complaint_fields for select
using (workspace_id = public.current_workspace_id());

create policy "agent_complaint_fields workspace insert"
on agent_complaint_fields for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_complaint_fields workspace update"
on agent_complaint_fields for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_complaint_fields workspace delete"
on agent_complaint_fields for delete
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

create policy "agent_products workspace select"
on agent_products for select
using (workspace_id = public.current_workspace_id());

create policy "agent_products workspace insert"
on agent_products for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_products workspace update"
on agent_products for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_products workspace delete"
on agent_products for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_sales_forms workspace select"
on agent_sales_forms for select
using (workspace_id = public.current_workspace_id());

create policy "agent_sales_forms workspace insert"
on agent_sales_forms for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_forms workspace update"
on agent_sales_forms for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_forms workspace delete"
on agent_sales_forms for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_sales_form_fields workspace select"
on agent_sales_form_fields for select
using (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_fields workspace insert"
on agent_sales_form_fields for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_fields workspace update"
on agent_sales_form_fields for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_fields workspace delete"
on agent_sales_form_fields for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_sales_form_products workspace select"
on agent_sales_form_products for select
using (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_products workspace insert"
on agent_sales_form_products for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_products workspace update"
on agent_sales_form_products for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_products workspace delete"
on agent_sales_form_products for delete
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

create policy "messages workspace select"
on messages for select
using (workspace_id = public.current_workspace_id());

create policy "messages workspace insert"
on messages for insert
with check (workspace_id = public.current_workspace_id());

create policy "messages workspace update"
on messages for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "messages workspace delete"
on messages for delete
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

create policy "product_images workspace select"
on product_images for select
using (workspace_id = public.current_workspace_id());

create policy "product_images workspace insert"
on product_images for insert
with check (workspace_id = public.current_workspace_id());

create policy "product_images workspace update"
on product_images for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "product_images workspace delete"
on product_images for delete
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

create policy "knowledge_files workspace select"
on knowledge_files for select
using (workspace_id = public.current_workspace_id());

create policy "knowledge_files workspace insert"
on knowledge_files for insert
with check (workspace_id = public.current_workspace_id());

create policy "knowledge_files workspace update"
on knowledge_files for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "knowledge_files workspace delete"
on knowledge_files for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));
