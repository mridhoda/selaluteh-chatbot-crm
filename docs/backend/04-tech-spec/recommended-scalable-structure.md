<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Recommended Scalable Structure

## MVP Structure

Keep the current monorepo-style structure:

```txt
server/
web/
docs/
```

Use repository and service layer inside `server`.

## After MVP Structure

When traffic and modules grow, evolve toward:

```txt
apps/
  api/
  worker/
  web/

packages/
  db/
  shared/
  integrations/
  config/
```

## Module Boundaries

```txt
identity
platforms
agents
crm
messaging
commerce
payments
storage
analytics
notifications
```

## Scaling Path

### Stage 1 — MVP

```txt
Express API + optional worker
Supabase Postgres
Local uploads
Payment sandbox
```

### Stage 2 — Stable Product

```txt
Dedicated worker
Redis queue
Protected media endpoint
Payment production
More tests
Observability dashboard
```

### Stage 3 — Larger Scale

```txt
Read replicas
CDN for public assets
Object storage migration if needed
Search engine for product/chat search
Data warehouse analytics
```

## When to Split Worker

Split worker when:

- AI replies slow webhook response.
- Payment notification retry needed.
- File download/transcription is heavy.
- Follow-up scheduler grows.

## When to Add Search Engine

Postgres search is enough for MVP. Add Meilisearch/Typesense when:

- products exceed thousands
- typo tolerance needed
- chat/message search is slow
- faceted search needed

## When to Move Files to Object Storage

Stay local for MVP. Move to S3/R2 when:

- multiple backend servers need same media
- uploads outgrow VPS disk
- CDN delivery needed
- backup/restore becomes painful

## When to Consider NestJS

Do not rewrite now. Consider NestJS only if:

- team grows
- service boundaries become complex
- strong DI/module conventions needed
- current Express structure becomes hard to maintain

## Future Multi-Seller Marketplace

Do not build in MVP, but schema can later add:

```txt
stores
seller_users
seller_wallets
commissions
payouts
seller_products
seller_order_items
```

For now, workspace acts as merchant/store.
