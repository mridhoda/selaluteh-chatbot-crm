<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Tech Stack

## Current Stack

| Area | Current Technology | Notes |
|---|---|---|
| Backend | Express.js | Existing REST API and webhook server |
| Frontend | React + Vite | Existing CRM dashboard |
| Current DB | MongoDB + Mongoose | Runtime existing app |
| Target DB | Supabase PostgreSQL | Migration target |
| AI | OpenAI + Gemini | OpenAI for text, Gemini fallback/vision/audio |
| Messaging | Telegram Bot API via webhook | Direct fetch, no Telegraf/grammy required |
| Other channels | Meta webhook for WhatsApp/Instagram | Existing integration retained |
| Storage | Local filesystem | `server/uploads`, served through `/files` |
| Deployment | Docker/Docker Compose | Existing deployment assets |
| Scheduler | node-cron currently | Should evolve into worker/queue |

## Recommended MVP Stack

```txt
Runtime: Node.js LTS
API Framework: Express.js retained for MVP
Database: Supabase PostgreSQL
DB Client: @supabase/supabase-js or pg
Data Access: Repository layer
Queue: BullMQ + Redis / Upstash Redis / lightweight internal queue initially
Payment: Midtrans Sandbox first, Xendit optional later
AI: OpenAI primary + Gemini fallback
Object/Binary Storage: Local server filesystem for MVP
Deployment: Docker Compose / VPS first, later Railway/Fly/Render possible
```

## Why Keep Express?

The existing backend is already Express-based and contains real product value: webhooks, auth, CRM inbox, AI, contacts, orders, complaints, and platform integrations. Rewriting to NestJS/Fastify before MVP would slow the project.

Keep Express for MVP, but improve maintainability with:

- route modules
- service layer
- repository layer
- typed validation schemas
- centralized error handling
- webhook idempotency
- integration tests

## Database Choice

Target database is **Supabase PostgreSQL** because marketplace features need strong relational consistency:

- products
- variants
- carts
- order items
- payments
- payment events
- workspace ownership
- indexes and RLS

MongoDB can remain during transition, but new marketplace schema should be Postgres-native.

## Payment Gateway Choice

Recommended order:

1. Midtrans Sandbox for Indonesian MVP testing.
2. Xendit later if needed.
3. Manual QRIS/payment proof remains only as fallback, not primary paid-state source.

## AI Provider Strategy

Use AI as assistant, not source of truth.

```txt
AI can:
  - answer FAQ
  - summarize product options
  - recommend products
  - propose actions

Backend must:
  - validate product IDs
  - validate prices
  - validate stock
  - create cart/order/payment
  - mark paid only from payment webhook
```

## Migration Compatibility

Current app uses Mongo/Mongoose. During migration, introduce repository contracts first so route/service behavior can stay stable while data implementation changes from Mongoose to Supabase.
