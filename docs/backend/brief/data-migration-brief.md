# Data Migration Brief

## Current Database

```txt
MongoDB/Mongoose
```

## Target Database

```txt
Supabase/Postgres
```

## Migration Goal

Move structured CRM and commerce data to Postgres without losing existing behavior.

## Core Rule

Every tenant-owned table should have:

```txt
workspace_id
```

This makes:

- filtering easier
- RLS easier
- route validation safer
- analytics simpler

## Storage Decision

Do not store large files in Postgres.

Use:

```txt
Local server storage for binary files
Postgres files table for metadata/path
```

## Migration Strategy

Recommended:

```txt
design schema
→ add repository layer
→ route-by-route migration
→ historical data import
→ cutover
→ verify
→ remove Mongo dependency
```

## Migration Safety First

Before migration:

- Secure orders.
- Secure complaints.
- Remove/protect diagnostic routes.
- Add webhook idempotency.
- Backup Mongo.
- Backup uploads.
- Prepare import script dry run.

## New Marketplace Tables

Add:

- product_categories
- products
- product_variants
- product_images
- carts
- cart_items
- checkouts
- order_items
- payments
- payment_events
- webhook_events
- ai_actions

## Import Rule

Mongo ObjectId should not be reused as UUID.

Use mapping:

```txt
collection + mongo _id → generated uuid
```
