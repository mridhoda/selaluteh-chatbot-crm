-- 006_indexes.sql
-- Query indexes for CRM, Telegram webhook, marketplace MVP, payments, and migration checks.

-- Identity
create unique index if not exists users_email_unique on users (email);
create index if not exists users_workspace_id_idx on users (workspace_id);
create index if not exists users_auth_user_id_idx on users (auth_user_id);
create index if not exists users_workspace_role_idx on users (workspace_id, role);

-- Platforms and agents
create index if not exists platforms_workspace_id_idx on platforms (workspace_id);
create index if not exists platforms_workspace_type_idx on platforms (workspace_id, type);
create index if not exists platforms_account_lookup_idx on platforms (type, account_id) where account_id <> '';
create index if not exists platforms_token_lookup_idx on platforms (type, token) where token <> '';
create index if not exists platforms_enabled_idx on platforms (workspace_id, enabled);

create index if not exists agents_workspace_id_idx on agents (workspace_id);
create index if not exists agents_platform_id_idx on agents (platform_id);
create index if not exists agents_ai_commerce_idx on agents (workspace_id, ai_commerce_mode);

create index if not exists agent_knowledge_agent_idx on agent_knowledge (agent_id);
create index if not exists agent_followups_agent_idx on agent_followups (agent_id);
create index if not exists agent_database_files_agent_idx on agent_database_files (agent_id);
create index if not exists agent_products_agent_idx on agent_products (agent_id);
create index if not exists agent_sales_forms_agent_idx on agent_sales_forms (agent_id);

-- CRM contacts/chats/messages
create index if not exists contacts_workspace_id_idx on contacts (workspace_id);
create index if not exists contacts_tags_gin_idx on contacts using gin (tags);
create index if not exists contacts_name_trgm_idx on contacts using gin (name gin_trgm_ops);
create index if not exists contacts_handle_trgm_idx on contacts using gin (handle gin_trgm_ops);

create index if not exists chats_workspace_last_message_idx on chats (workspace_id, last_message_at desc nulls last);
create index if not exists chats_contact_id_idx on chats (contact_id);
create index if not exists chats_platform_contact_idx on chats (workspace_id, platform_id, contact_id);
create index if not exists chats_takeover_by_idx on chats (workspace_id, takeover_by);
create index if not exists chats_status_idx on chats (workspace_id, status);
create index if not exists chats_unread_idx on chats (workspace_id, unread);
create index if not exists chats_escalated_idx on chats (workspace_id, is_escalated);

create index if not exists messages_chat_created_idx on messages (chat_id, created_at);
create index if not exists messages_workspace_created_idx on messages (workspace_id, created_at desc);
create index if not exists messages_platform_message_id_idx on messages (platform_message_id) where platform_message_id is not null;
create index if not exists messages_reply_to_idx on messages (reply_to);
create index if not exists messages_text_trgm_idx on messages using gin (text gin_trgm_ops);

create index if not exists webhook_events_workspace_idx on webhook_events (workspace_id, received_at desc);
create index if not exists webhook_events_status_idx on webhook_events (status, received_at desc);
create index if not exists webhook_events_provider_type_idx on webhook_events (provider, event_type);
create index if not exists ai_actions_workspace_chat_idx on ai_actions (workspace_id, chat_id, created_at desc);
create index if not exists ai_actions_status_idx on ai_actions (workspace_id, status);

-- Files
create index if not exists files_workspace_id_idx on files (workspace_id);
create index if not exists files_source_idx on files (workspace_id, source);
create index if not exists files_public_path_idx on files (public_path);
create index if not exists files_mime_type_idx on files (workspace_id, mime_type);

-- Marketplace catalog
create index if not exists product_categories_workspace_idx on product_categories (workspace_id, is_active, position);
create index if not exists product_categories_parent_idx on product_categories (workspace_id, parent_id);
create index if not exists products_workspace_status_idx on products (workspace_id, status, sort_order);
create index if not exists products_category_idx on products (workspace_id, category_id, status);
create index if not exists products_featured_idx on products (workspace_id, is_featured) where is_featured = true;
create index if not exists products_name_trgm_idx on products using gin (name gin_trgm_ops);
create index if not exists products_description_trgm_idx on products using gin (description gin_trgm_ops);
create index if not exists products_tags_gin_idx on products using gin (tags);
create index if not exists product_variants_product_idx on product_variants (product_id, is_active, sort_order);
create index if not exists product_images_product_idx on product_images (product_id, position);

-- Cart / checkout
create index if not exists carts_contact_active_idx on carts (workspace_id, contact_id, status);
create index if not exists carts_chat_active_idx on carts (workspace_id, chat_id, status);
create index if not exists carts_expires_idx on carts (expires_at) where status = 'active';
create index if not exists cart_items_cart_idx on cart_items (cart_id);
create index if not exists checkouts_cart_idx on checkouts (cart_id);
create index if not exists checkouts_status_idx on checkouts (workspace_id, status, created_at desc);

-- Orders/payments/complaints
create index if not exists orders_workspace_status_created_idx on orders (workspace_id, status, created_at desc);
create index if not exists orders_contact_created_idx on orders (workspace_id, contact_id, created_at desc);
create index if not exists orders_chat_id_idx on orders (chat_id);
create index if not exists orders_payment_status_idx on orders (workspace_id, payment_status, created_at desc);
create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists order_items_product_idx on order_items (workspace_id, product_id);

create index if not exists payments_workspace_status_idx on payments (workspace_id, status, created_at desc);
create index if not exists payments_order_idx on payments (order_id);
create index if not exists payments_provider_transaction_idx on payments (provider, provider_transaction_id) where provider_transaction_id is not null;
create index if not exists payment_events_payment_idx on payment_events (payment_id, created_at desc);
create index if not exists payment_events_order_idx on payment_events (order_id, created_at desc);

create index if not exists complaints_workspace_status_created_idx on complaints (workspace_id, status, created_at desc);
create index if not exists complaints_chat_id_idx on complaints (chat_id);
create index if not exists complaints_assigned_idx on complaints (workspace_id, assigned_to, status);
