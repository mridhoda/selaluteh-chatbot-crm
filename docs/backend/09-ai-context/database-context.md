# Database Context for AI

Dokumen ini memberi ringkasan data-layer context untuk AI coding agent.

## Current Runtime

Current backend runtime masih MongoDB/Mongoose.

## Target Data Layer

Target adalah Supabase/Postgres dengan:

- explicit `workspaces`,
- `workspace_id` di semua tenant-owned tables,
- normalized agent child tables,
- CRM tables: contacts/chats/messages,
- marketplace tables: products/cart/checkout/order_items/payments,
- local file metadata table `files`,
- RLS policies prepared.

## Migration Strategy

Recommended:

```txt
schema design
-> repository layer
-> route-by-route migration
-> historical import
-> cutover
-> remove Mongo dependency
```

## AI Coding Rule

If task touches data access:

- do not call DB directly from scattered logic,
- prefer repository/service,
- preserve query contracts,
- preserve timestamps during migration,
- do not infer workspace from user alone when row has workspace_id.

## Important Query Contracts

- contact upsert: `workspace_id + platform_type + platform_account_id`
- chat upsert: `workspace_id + platform_id + contact_id`
- inbox sort: `last_message_at desc`
- messages sort: `created_at asc`
- orders/complaints: auth + workspace scope
- webhook idempotency: no duplicate provider message/event id
