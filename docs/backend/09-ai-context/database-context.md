# Database Context for AI

Dokumen ini memberi ringkasan data-layer context untuk AI coding agent.

## Current Runtime

The backend runtime runs 100% on Supabase/Postgres. MongoDB/Mongoose has been completely removed from dependencies, config, tests, and source code.

## Active Data Layer

Supabase/Postgres schema sudah dibuat dengan:

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
Supabase foundation
-> freeze repository contracts
-> seed fresh Supabase dev/test data
-> implement Supabase-backed repositories domain-by-domain
-> switch routes/services domain-by-domain
-> remove Mongo connection/models/dependency/MongoMemoryServer/DATA_SOURCE=mongo fallback
```

Explicitly not part of this cutover:

```txt
Mongo backfill
dual-write
legacy data reconciliation
Supabase Auth migration
```

## AI Coding Rule

If task touches data access:

- do not call DB directly from scattered logic,
- prefer repository/service,
- preserve query contracts,
- do not infer workspace from user alone when row has workspace_id.
- do not add new Mongoose model usage.
- use Supabase tests for new repositories/features.

## Important Query Contracts

- contact upsert: `workspace_id + platform_id + external_id`
- chat upsert: `workspace_id + platform_id + contact_id`
- inbox sort: `last_message_at desc`
- messages sort: `created_at asc`
- orders/complaints: auth + workspace scope
- webhook idempotency: no duplicate provider message/event id
