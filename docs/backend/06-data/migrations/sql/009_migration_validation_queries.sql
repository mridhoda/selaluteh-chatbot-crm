-- 009_migration_validation_queries.sql
-- Non-destructive validation queries for staging and post-migration checks.
-- Run manually after importing Mongo data and local file metadata.

select 'chats without workspace' as check_name, count(*) as count from chats where workspace_id is null;
select 'chat_messages without chat' as check_name, count(*) as count from chat_messages where chat_id is null;
select 'chat_messages without workspace' as check_name, count(*) as count from chat_messages where workspace_id is null;
select 'orders without workspace' as check_name, count(*) as count from orders where workspace_id is null;
select 'orders without outlet' as check_name, count(*) as count from orders where outlet_id is null;
select 'orders without contact' as check_name, count(*) as count from orders where contact_id is null;
select 'orders without chat' as check_name, count(*) as count from orders where chat_id is null;
select 'complaints without workspace' as check_name, count(*) as count from complaints where workspace_id is null;
select 'agents without workspace' as check_name, count(*) as count from agents where workspace_id is null;
select 'payments without workspace' as check_name, count(*) as count from payments where workspace_id is null;
select 'payments without order' as check_name, count(*) as count from payments where order_id is null;
select 'payment events without workspace' as check_name, count(*) as count from payment_events where workspace_id is null;
select 'unmapped mongo ids' as check_name, count(*) as count from mongo_id_map where target_uuid is null;

select m.id as chat_message_id, m.workspace_id as message_workspace_id, c.workspace_id as chat_workspace_id
from chat_messages m
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

select chi.id as checkout_item_id, chi.workspace_id as item_workspace_id, c.workspace_id as checkout_workspace_id
from checkout_items chi
join checkouts c on c.id = chi.checkout_id
where chi.workspace_id <> c.workspace_id
limit 50;

select p.id as payment_id, p.workspace_id as payment_workspace_id, o.workspace_id as order_workspace_id
from payments p
join orders o on o.id = p.order_id
where p.workspace_id <> o.workspace_id
limit 50;

select pe.id as payment_event_id, pe.workspace_id as event_workspace_id, p.workspace_id as payment_workspace_id
from payment_events pe
join payments p on p.id = pe.payment_id
where pe.workspace_id <> p.workspace_id
limit 50;

select pe.id as payment_event_id, pe.workspace_id as event_workspace_id, o.workspace_id as order_workspace_id
from payment_events pe
join orders o on o.id = pe.order_id
where pe.workspace_id <> o.workspace_id
limit 50;

select provider, provider_event_id, count(*) as duplicate_count
from payment_events
where provider_event_id is not null and provider_event_id <> ''
group by provider, provider_event_id
having count(*) > 1;

select provider, coalesce(platform_id, '00000000-0000-0000-0000-000000000000'::uuid) as platform_key, external_event_id, count(*) as duplicate_count
from webhook_events
group by provider, coalesce(platform_id, '00000000-0000-0000-0000-000000000000'::uuid), external_event_id
having count(*) > 1;

select workspace_id, idempotency_key, count(*) as duplicate_count
from checkouts
where idempotency_key is not null and idempotency_key <> ''
group by workspace_id, idempotency_key
having count(*) > 1;

select workspace_id, order_number, count(*) as duplicate_count
from orders
where order_number is not null and order_number <> ''
group by workspace_id, order_number
having count(*) > 1;

select 'products' as table_name, count(*) from products
union all select 'product_variants', count(*) from product_variants
union all select 'product_outlet_availability', count(*) from product_outlet_availability
union all select 'carts', count(*) from carts
union all select 'cart_items', count(*) from cart_items
union all select 'checkouts', count(*) from checkouts
union all select 'checkout_items', count(*) from checkout_items
union all select 'orders', count(*) from orders
union all select 'order_items', count(*) from order_items
union all select 'order_events', count(*) from order_events
union all select 'payments', count(*) from payments
union all select 'payment_attempts', count(*) from payment_attempts
union all select 'payment_events', count(*) from payment_events
union all select 'agents', count(*) from agents
union all select 'complaints', count(*) from complaints;
