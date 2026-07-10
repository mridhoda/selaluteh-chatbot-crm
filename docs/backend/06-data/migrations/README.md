# Data Migrations — Telegram Marketplace MVP v2

Folder ini adalah migration pack Supabase/Postgres untuk project **KALIS.AI / eskala-bot**.

Keputusan cutover final adalah fresh-start Supabase/Postgres. MongoDB/Mongoose tidak diimport, tidak di-dual-write, dan tidak direkonsiliasi karena hanya berisi data testing legacy.

```txt
Existing app:
  Chatbot CRM + Telegram/WhatsApp/Instagram webhook + AI Agent + Human Takeover

New MVP direction:
  Telegram-first single-merchant marketplace
  Product catalog -> Cart -> Checkout -> Order -> Payment gateway sandbox -> Payment webhook
```

## Structure

```txt
migrations-v2/
  README.md
  sql/
    001_extensions_and_enums.sql
    002_core_identity.sql
    003_platforms_agents.sql
    004_crm_chats_messages.sql
    005_orders_complaints_files.sql
    006_indexes.sql
    007_rls_policies.sql
    008_local_file_storage.sql
    009_migration_validation_queries.sql
    010_product_modifiers.sql
  notes/
    mongo-to-postgres-mapping.md
    seed-data-order.md
    cutover-plan.md
    telegram-commerce-flow.md
    payment-gateway-contract.md
    repository-layer-contract.md
    marketplace-schema-notes.md
  checklists/
    pre-migration-checklist.md
    post-migration-checklist.md
    marketplace-mvp-checklist.md
  manifest.json
  ALL_MIGRATIONS_COMBINED.md
```

## Canonical Schema Source

All docs and SQL in this folder are aligned to:

```txt
docs/backend/06-data/database-schema.md   # canonical field names + status enums
docs/backend/06-data/entities.md
docs/backend/06-data/query-contracts.md
```

Key naming decisions:

```txt
workspace_settings        replaces settings
chat_messages             replaces messages
taken_over_by_user_id     replaces takeover_by
contacts.external_id      replaces platform_account_id
agents.* JSONB fields     replaces normalized agent child tables
agent_outlets.outlet_id   replaces legacy agent.outlets string array
```

Operational tables required at runtime:

```txt
files, webhook_events, ai_actions, checkouts
```

## How to Use

1. Review all docs in `notes/` and `checklists/`.
2. Run SQL files `001` to `008` on a fresh Supabase staging project.
3. Use `009_migration_validation_queries.sql` only for manual validation, not as an automatic migration.
4. Build repository layer so app routes can move from Mongoose to Supabase table-by-table.
5. Seed fresh Supabase development/testing data.
6. Implement Supabase repositories domain-by-domain.
7. Add marketplace data and Telegram commerce flow.
8. Test with Telegram bot sandbox/test bot.
9. Add Midtrans/Xendit sandbox payment flow.
10. Remove Mongo/Mongoose only after every runtime domain is Supabase-backed and tests pass.

## Core Decisions

- `workspace_id` is the tenant boundary for every operational table.
- Postgres stores structured data and file metadata.
- Local server filesystem stores media binaries.
- AI can assist commerce but must not be the source of truth for order/payment state.
- Cart, checkout, order, and payment must be deterministic backend flows.
- Public webhooks write through backend service role, but provider validation and idempotency are mandatory.
- Custom backend auth remains in place for this cutover; Supabase Auth is deferred.
- Automated tests must use Supabase local or a dedicated Supabase test project, never production.

## New Marketplace Tables

```txt
product_categories
products
product_variants
product_images
modifier_groups
modifier_options
product_modifier_groups
carts
cart_items
checkouts
orders
order_items
payments
payment_events
webhook_events
ai_actions
```

## Important Compatibility Notes

The old `orders` model created by `FILE_ORDER_JSON` is not removed. It is absorbed into the expanded `orders` table using:

```txt
source = ai_form
form_name
form_data
status = new / processed / completed / cancelled
```

New Telegram marketplace orders should use:

```txt
source = telegram
cart_id
checkout_id
order_items
payments
payment_events
```

## Status

These are migration drafts and should be reviewed in staging before production.
