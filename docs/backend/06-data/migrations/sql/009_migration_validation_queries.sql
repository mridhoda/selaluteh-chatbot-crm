-- 009_migration_validation_queries.sql
-- Non-destructive validation queries for staging and post-migration checks.
-- Run manually after importing Mongo data and local file metadata.

-- Required references should be zero.
select 'chats without workspace' as check_name, count(*) as count from chats where workspace_id is null;
select 'messages without chat' as check_name, count(*) as count from messages where chat_id is null;
select 'messages without workspace' as check_name, count(*) as count from messages where workspace_id is null;
select 'orders without workspace' as check_name, count(*) as count from orders where workspace_id is null;
select 'complaints without workspace' as check_name, count(*) as count from complaints where workspace_id is null;

-- Cross-workspace consistency checks should return zero rows.
select m.id as message_id, m.workspace_id as message_workspace_id, c.workspace_id as chat_workspace_id
from messages m
join chats c on c.id = m.chat_id
where m.workspace_id <> c.workspace_id
limit 50;

select ci.id as cart_item_id, ci.workspace_id as item_workspace_id, c.workspace_id as cart_workspace_id
from cart_items ci
join carts c on c.id = ci.cart_id
where ci.workspace_id <> c.workspace_id
limit 50;

select oi.id as order_item_id, oi.workspace_id as item_workspace_id, o.workspace_id as order_workspace_id
from order_items oi
join orders o on o.id = oi.order_id
where oi.workspace_id <> o.workspace_id
limit 50;

-- Marketplace readiness counts.
select 'products' as table_name, count(*) from products
union all select 'product_variants', count(*) from product_variants
union all select 'carts', count(*) from carts
union all select 'orders', count(*) from orders
union all select 'payments', count(*) from payments
union all select 'payment_events', count(*) from payment_events;
