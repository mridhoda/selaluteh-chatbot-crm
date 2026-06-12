---

# FILE: README.md

# Brief Docs

Folder ini berisi dokumen brief untuk **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**.

Brief adalah versi ringkas dari dokumen besar. Tujuannya supaya manusia atau AI coding agent bisa memahami konteks penting project dengan cepat sebelum masuk ke docs detail.

## Fungsi Folder Brief

Gunakan folder ini untuk:

- Memberi konteks cepat ke AI coding agent.
- Menjelaskan project dalam 1–3 halaman.
- Membantu onboarding developer baru.
- Menjadi ringkasan sebelum membaca folder detail.
- Menjaga task tetap fokus.

## Batasan Folder Ini

Brief tidak menggantikan docs lengkap.

Untuk detail, baca folder:

```txt
0000-business      → business strategy
00-overview        → overview project
01-product         → product requirements
02-flows           → process flows
03-business-rules  → business rules
04-tech-spec       → technical architecture
05-api-spec        → API contracts
06-data            → database/data migration
07-uiux            → UI/UX
08-security        → security
09-ai-context      → AI coding context
10-testing         → testing/QA
11-sprint          → sprint planning
```

## Recommended Reading Order

1. `project-brief.md`
2. `mvp-brief.md`
3. `current-system-brief.md`
4. `target-system-brief.md`
5. `implementation-priority-brief.md`
6. `ai-agent-task-brief.md`

## Main Direction

Project ini bergerak dari:

```txt
AI Chatbot CRM
```

menjadi:

```txt
Telegram-first single-merchant marketplace MVP
```

dengan tetap mempertahankan existing CRM, Telegram webhook, AI agents, inbox, human takeover, contacts, orders, complaints, dan dashboard.


---

# FILE: project-brief.md

# Project Brief

## Project Name

SelaluTeh Chatbot CRM — Telegram Marketplace MVP

## One-Liner

An AI-powered chatbot CRM that is evolving into a Telegram-first conversational commerce system where customers can browse products, add items to cart, checkout, pay through a sandbox payment link, and receive order updates inside Telegram.

## Current Project Type

The current app is primarily:

```txt
Chatbot CRM multi-platform
```

It already supports:

- Telegram webhook.
- WhatsApp/Instagram webhook.
- AI agents.
- Inbox/chat history.
- Human takeover.
- Contacts.
- Legacy orders.
- Complaints.
- Dashboard.
- MongoDB/Mongoose runtime.

## New Product Direction

The new direction is:

```txt
Chat-first commerce backend
```

Starting with:

```txt
Telegram-first single-merchant marketplace MVP
```

## Core MVP Flow

```txt
Telegram user
→ /start
→ browse products
→ view product detail
→ add to cart
→ checkout
→ receive payment link
→ pay in sandbox
→ payment webhook updates order
→ user receives paid notification
→ admin sees order/payment status
```

## Important Principle

Do not rebuild from scratch.

Continue the existing CRM foundation and add marketplace primitives step by step.

## MVP Scope

In scope:

- Product catalog.
- Product variants.
- Cart.
- Checkout.
- Order items.
- Payment sandbox.
- Payment webhook.
- Telegram inline button commerce.
- Admin product/order operations.
- AI shopping assistant.
- Human takeover.

Out of scope:

- Multi-seller marketplace.
- Seller wallet.
- Seller payout.
- Commission engine.
- Logistics provider.
- Refund automation.
- Voucher engine.
- Public web storefront.


---

# FILE: mvp-brief.md

# MVP Brief

## MVP Goal

Prove that a customer can complete a product purchase flow from Telegram while the backend keeps structured order and payment state.

## MVP Success Demo

The MVP is successful if this flow works end-to-end:

```txt
Telegram bot opens
→ product list shown
→ customer adds product to cart
→ customer confirms checkout
→ backend creates pending order
→ backend creates payment link
→ payment webhook marks payment paid
→ backend updates order status
→ Telegram sends paid confirmation
→ admin sees paid order
```

## MVP Users

### Customer

Uses Telegram to:

- Browse products.
- Ask questions.
- Add items to cart.
- Checkout.
- Pay.
- Receive order updates.

### Admin

Uses dashboard to:

- Manage products.
- View orders.
- View payment status.
- Monitor chats.
- Take over AI conversation.
- Handle complaints.

### AI Agent

Helps with:

- Product explanation.
- Product recommendation.
- FAQ.
- Checkout guidance.
- Escalation to human.

AI must not:

- Mark payment as paid.
- Override product price.
- Create final order without backend validation.
- Ignore cart/checkout confirmation.

## MVP Must-Haves

- Secure auth and workspace isolation.
- Product catalog.
- Cart service.
- Checkout service.
- Order items.
- Payment record.
- Payment webhook.
- Telegram inline keyboard actions.
- Webhook idempotency.
- Admin order visibility.

## MVP Should-Haves

- AI product Q&A.
- Basic analytics.
- Payment event view.
- Human takeover context.
- Order status command.

## MVP Not Included

- Multi-seller.
- Payout.
- Commission.
- Voucher.
- Logistics integration.
- Refund automation.
- Advanced inventory reservation.


---

# FILE: current-system-brief.md

# Current System Brief

## Current Backend

The backend currently behaves as a Chatbot CRM system.

## Existing Core Modules

- Auth.
- Users/workspace concept.
- Platforms.
- Agents.
- Chats.
- Messages.
- Contacts.
- Orders.
- Complaints.
- Analytics.
- Local files.
- Telegram webhook.
- Meta webhook.
- AI reply pipeline.
- Human takeover.

## Current Runtime Stack

- Express backend.
- React/Vite frontend.
- MongoDB/Mongoose.
- Custom JWT auth.
- OpenAI/Gemini AI integration.
- Local file uploads.

## Current Strengths

- Telegram webhook already exists.
- Message storage already exists.
- Contact/chat relation already exists.
- Dashboard/inbox already exists.
- AI agent config already exists.
- Human takeover already exists.
- Legacy order/complaint flow already exists.

## Current Weaknesses for Marketplace

- No standalone product catalog.
- No cart.
- No checkout.
- No normalized order items.
- No payment gateway.
- No payment webhook.
- No payment event log.
- No Telegram inline commerce flow.
- Legacy orders are AI form-driven.
- Orders/complaints route security must be hardened.
- Webhook idempotency must be added.

## Do Not Break

When implementing new marketplace features, do not break:

- Login.
- Dashboard.
- Inbox.
- Telegram webhook.
- AI reply.
- Human takeover.
- Existing chat history.
- Contacts.
- Existing order/complaint compatibility.


---

# FILE: target-system-brief.md

# Target System Brief

## Target Backend Type

```txt
AI CRM + Telegram conversational commerce backend
```

## Target Architecture Summary

```txt
Telegram user
  ↓
Telegram webhook
  ↓
Webhook idempotency
  ↓
Chat/contact/session resolution
  ↓
Commerce action parser
  ↓
Product/cart/checkout/order/payment services
  ↓
Database
  ↓
Telegram response
```

## Target Database Direction

Current runtime:

```txt
MongoDB/Mongoose
```

Target migration:

```txt
Supabase/Postgres
```

Storage decision:

```txt
Structured data → Supabase/Postgres
Large media files → local server filesystem
File metadata → database files table
```

## Target Data Modules

Core CRM:

- workspaces
- users
- platforms
- agents
- contacts
- chats
- messages
- orders
- complaints
- files

Marketplace:

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

## Target Commerce Flow

```txt
Product
→ Cart
→ Checkout
→ Order
→ Payment
→ Payment Event
→ Fulfillment Status
```

## Target AI Role

AI should become a safe assistant:

- Answer product questions.
- Recommend product.
- Explain checkout steps.
- Suggest action.
- Escalate when unsure.

Backend remains source of truth.

## Target Admin Role

Admin should operate:

- products
- chats
- orders
- payment status
- complaints
- agents
- platforms


---

# FILE: implementation-priority-brief.md

# Implementation Priority Brief

## Recommended Priority Order

Do not start with payment first.

Recommended order:

```txt
1. Stabilize existing backend
2. Add webhook idempotency
3. Add service/repository boundaries
4. Add product catalog
5. Add cart
6. Add checkout
7. Add payment sandbox
8. Add Telegram commerce buttons
9. Add admin operations
10. Harden MVP
```

## Why This Order

### Payment depends on order

Payment link needs a pending order.

### Order depends on checkout

Order should be created from validated checkout.

### Checkout depends on cart

Checkout must validate cart items and totals.

### Cart depends on product

Cart item must reference active product/variant.

### Telegram commerce depends on product/cart

Inline buttons must call deterministic backend actions.

## Sprint Order

### Sprint 0 — Stabilization

- Secure orders.
- Secure complaints.
- Protect diagnostic routes.
- Keep Telegram webhook working.

### Sprint 1 — Webhook and Service Boundary

- Add webhook event idempotency.
- Extract chat/message/order/complaint services.
- Prepare AI action logging.

### Sprint 2 — Product Catalog

- Products.
- Categories.
- Variants.
- Product images.
- Product CRUD.

### Sprint 3 — Cart and Telegram Product Browsing

- Cart.
- Cart items.
- Telegram inline keyboard.
- Product list/detail.
- Add to cart.

### Sprint 4 — Checkout and Payment

- Checkout confirmation.
- Create order with order items.
- Payment link.
- Payment webhook.
- Payment event log.

### Sprint 5 — Admin Ops

- Product management.
- Order detail.
- Payment status.
- Customer chat context.

### Sprint 6 — Hardening

- Regression.
- Security checklist.
- Payment tests.
- Webhook tests.
- MVP demo.

## Current Best Next Step

Start with:

```txt
Sprint 0 — Stabilization
```

Because marketplace/payment should not be added before routes and workspace access are safe.


---

# FILE: current-priority-brief.md

# Current Priority Brief

## Current Priority

The safest current priority is:

```txt
Stabilize existing CRM before building marketplace/payment.
```

## Why

Payment and commerce features are sensitive.

Before adding them, backend must have:

- secure order routes
- secure complaint routes
- workspace isolation
- webhook idempotency
- diagnostic route cleanup
- stable Telegram webhook behavior

## Immediate Focus

### Priority 1 — Security Stabilization

- Add auth to orders.
- Add auth to complaints.
- Workspace-scope both modules.
- Remove/protect diagnostic routes.

### Priority 2 — Webhook Idempotency

- Add webhook event storage.
- Prevent duplicate Telegram message.
- Prepare payment webhook idempotency.

### Priority 3 — Product Catalog

- Add product category.
- Add product.
- Add variants.
- Add active/draft/archive status.

### Priority 4 — Cart/Checkout

- Add cart and cart item.
- Add checkout confirmation.
- Create order items snapshot.

### Priority 5 — Payment Sandbox

- Add payment provider abstraction.
- Add payment link.
- Add payment webhook.
- Add paid notification.

## Not Current Priority

Do not start with:

- multi-seller
- payout
- commission
- refund automation
- advanced AI recommendations
- logistics integration


---

# FILE: telegram-commerce-brief.md

# Telegram Commerce Brief

## Purpose

Make Telegram the first commerce interface for MVP.

## Why Telegram

- Existing project already supports Telegram webhook.
- Telegram inline keyboard is suitable for deterministic actions.
- Faster to test than WhatsApp commerce.
- Payment can be external link.

## Main Telegram Actions

```txt
/start
product:list
product:detail:<product_id>
cart:add:<variant_id>
cart:view
cart:update:<cart_item_id>:<qty>
cart:remove:<cart_item_id>
cart:clear
checkout:start
checkout:confirm
order:status:<order_id>
```

## Customer Flow

```txt
/start
→ bot shows menu
→ customer taps View Products
→ bot shows product list
→ customer taps product
→ bot shows detail and Add to Cart
→ customer adds item
→ bot shows cart summary
→ customer checks out
→ bot sends payment link
→ bot sends paid notification after webhook
```

## Important Rules

- Do not rely only on free-text parsing for commerce.
- Use buttons for critical actions.
- Validate every callback payload.
- Do not expose internal IDs unnecessarily if callback token can be used.
- Duplicate Telegram webhook must not create duplicate cart/order/payment action.
- Human takeover should still work for support.

## AI Role in Telegram

AI can answer:

- product questions
- availability explanation
- recommendations
- FAQ
- support questions

AI should not perform payment/order finalization.


---

# FILE: payment-brief.md

# Payment Brief

## Payment Strategy

Use external payment link from a payment gateway sandbox.

Recommended providers to support:

- Midtrans sandbox.
- Xendit sandbox.
- Manual/sandbox adapter for development.

## Payment Flow

```txt
Checkout confirmed
→ backend creates pending order
→ backend creates payment record
→ backend calls provider create payment link
→ provider returns payment link
→ bot sends link to Telegram user
→ provider sends webhook
→ backend verifies webhook signature
→ backend stores payment_event
→ backend updates payment
→ backend updates order
→ backend notifies Telegram user
```

## Payment Is Authoritative

Payment status can only be changed by:

- verified payment webhook
- authorized admin action for manual mode

Not allowed:

- customer text
- AI response
- unverified webhook

## Required Data

Payment should store:

- workspace_id
- order_id
- provider
- provider_reference_id
- amount
- currency
- status
- payment_link_url
- expires_at
- paid_at
- raw provider metadata if needed

Payment event should store:

- payment_id
- provider
- event_type
- provider_event_id
- raw_payload
- signature_valid
- processed_at

## Idempotency

Duplicate payment webhook must not:

- create duplicate payment event with same provider_event_id
- double-update order
- double-send paid notification if already processed

## MVP Payment Statuses

Recommended statuses:

```txt
pending
requires_action
paid
failed
expired
cancelled
refunded
```

Refund can be reserved for later.


---

# FILE: data-migration-brief.md

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


---

# FILE: ai-agent-brief.md

# AI Agent Brief

## Current AI Role

The current system uses AI agents to reply to customer chat, using provider integration such as OpenAI/Gemini.

Existing AI can:

- reply to messages
- use configured prompt/behavior
- use knowledge entries
- create legacy orders/complaints via markers
- escalate to human

## Target AI Role

AI should become a safe shopping assistant.

AI can:

- answer product questions
- recommend products
- explain checkout steps
- summarize cart/order
- ask clarifying questions
- escalate to human

AI cannot:

- mark payment as paid
- override product price
- create final order without backend validation
- bypass checkout confirmation
- ignore product status/availability
- access another workspace's data

## Backend-Validated Actions

AI may propose actions like:

```txt
search_product
show_product_detail
suggest_add_to_cart
start_checkout
check_order_status
handoff_to_human
```

Backend must validate and execute.

## AI Action Logging

Recommended table:

```txt
ai_actions
```

Purpose:

- Track proposed AI action.
- Track execution status.
- Debug AI behavior.
- Prevent hidden side effects.

## Prompt Guardrail

System prompt should tell AI:

```txt
You are a shopping assistant.
You may guide the customer.
Do not claim payment is successful unless backend/payment provider says so.
Do not invent product price or availability.
Use backend product data when available.
Escalate if uncertain.
```


---

# FILE: security-brief.md

# Security Brief

## Security Priority

Security must be handled before payment and marketplace launch.

## P0 Security Issues to Fix

- Orders routes must require auth.
- Complaints routes must require auth.
- Workspace isolation must be enforced.
- Diagnostic user routes must be removed/protected.
- Webhook idempotency must be implemented.
- Payment webhook signature must be verified.
- Service role key must never reach frontend.
- Secrets must not be committed.

## Workspace Isolation

Every tenant-owned query must be scoped by:

```txt
workspace_id
```

Cross-workspace data access should return safe errors.

## Webhook Security

For Telegram:

- Validate platform/token mapping.
- Store webhook event id.
- Skip duplicate events.

For payment:

- Verify signature.
- Store raw event.
- Process idempotently.

For Meta:

- Verify webhook setup token.
- Plan POST signature validation.

## AI Security

AI must not:

- execute critical state changes directly
- access unauthorized data
- trust user-provided payment status
- reveal internal prompts/secrets

## File Security

Current local files may be public through `/files`.

MVP may accept public files for simplicity, but future protected endpoint should:

- authenticate user
- check workspace
- stream file from local disk

## Secret Policy

Never expose:

- JWT_SECRET
- Telegram bot token
- payment provider keys
- Supabase service role key
- OpenAI/Gemini API keys


---

# FILE: testing-brief.md

# Testing Brief

## Testing Goal

Ensure Telegram commerce MVP works without breaking existing CRM.

## Core Test Areas

### Existing CRM Regression

- Login.
- Dashboard.
- Platforms.
- Agents.
- Inbox.
- Chat messages.
- Human takeover.
- AI reply.
- Orders.
- Complaints.

### Telegram Tests

- `/start`
- Product list.
- Product detail.
- Add to cart.
- View cart.
- Checkout.
- Payment link message.
- Duplicate webhook event.
- Invalid callback payload.

### Payment Tests

- Create payment link.
- Receive sandbox webhook.
- Verify signature.
- Store payment event.
- Update payment status.
- Update order status.
- Duplicate webhook idempotency.

### Security Tests

- Unauthenticated order access denied.
- Unauthenticated complaint access denied.
- Cross-workspace data denied.
- Service role key not exposed.
- Payment spoof rejected.

### Data Migration Tests

- SQL migrations run cleanly.
- Import dry run works.
- Count validation works.
- Message order preserved.
- File metadata maps correctly.

## MVP Acceptance Test

End-to-end:

```txt
Telegram user
→ product
→ cart
→ checkout
→ payment link
→ sandbox paid webhook
→ paid order
→ admin sees order
```

## Testing Rule

Do not claim tests passed unless they were actually run.

If not run, write:

```txt
Not run — reason: ...
```


---

# FILE: task-brief-template.md

# Task Brief Template

Use this template when giving a focused task to an AI coding agent.

```md
# Task Brief: <task name>

## Context

This project is SelaluTeh Chatbot CRM evolving into Telegram-first marketplace MVP.

Current stack:
- Express backend
- React/Vite frontend
- MongoDB/Mongoose current runtime
- Target Supabase/Postgres migration
- Telegram webhook existing
- AI agents existing
- Human takeover existing

## Goal

<clear goal>

## Scope

In scope:
- ...

Out of scope:
- ...

## Files Likely To Change

- ...

## Requirements

- [ ] ...
- [ ] ...
- [ ] ...

## Acceptance Criteria

- [ ] ...
- [ ] ...

## Do Not Break

- Login
- Dashboard
- Inbox
- Telegram webhook
- AI reply
- Human takeover
- Existing chat history
- Workspace isolation

## Testing

- [ ] Unit test
- [ ] Integration test
- [ ] Manual smoke test

## Expected Response Format

Please respond with:
1. Summary
2. Files changed
3. Implementation notes
4. Tests run or not run
5. Risks
6. Next recommended step
```


---

# FILE: agent-handoff-brief.md

# Agent Handoff Brief

Use this brief when handing the project to another AI coding agent.

## Project Summary

This is an existing Chatbot CRM backend being extended into a Telegram-first marketplace MVP.

Do not rebuild from scratch.

## Current System

Existing:

- Express backend.
- React/Vite frontend.
- MongoDB/Mongoose.
- Telegram webhook.
- Meta webhook.
- AI agents.
- Inbox.
- Human takeover.
- Contacts.
- Messages.
- Legacy orders/complaints.
- Local files.

## Target System

Add:

- Product catalog.
- Cart.
- Checkout.
- Order items.
- Payment sandbox.
- Payment webhook.
- Telegram inline commerce.
- Admin product/order operations.
- AI commerce guardrails.
- Supabase/Postgres migration path.

## Most Important Rules

1. Do not break existing CRM.
2. Secure orders and complaints before payment.
3. Backend owns commerce state.
4. AI assists but does not mark payment/order status.
5. Payment webhook must be verified and idempotent.
6. Every tenant-owned query must be workspace-scoped.
7. Local media stays in server storage; DB stores metadata.
8. Prefer small safe changes over big rewrites.

## Best Next Task

Start with:

```txt
Sprint 0 — Stabilization
```

Focus:

- Orders auth.
- Complaints auth.
- Diagnostic routes.
- Settings route.
- Smoke tests.


---

# FILE: folder-map-brief.md

# Folder Map Brief

## Main Docs Folder Map

```txt
0000-business      Business strategy and validation
00-overview        High-level project overview
000-research       Market/technical research
01-product         Product requirements and personas
02-flows           Process/user/system flows
03-business-rules  Business rules and domain policies
04-tech-spec       Technical architecture and backend design
05-api-spec        Endpoint contracts
06-data            Database schema and migration
07-uiux            Admin/dashboard/UI/UX docs
08-security        Security design and threat model
09-ai-context      Context/rules for AI coding agents
10-testing         QA and testing plans
11-sprint          Execution planning and sprint docs
brief              Short summaries for quick onboarding
chatgpt-context    Context packs/prompts for AI tools
```

## When to Use Brief

Use `brief/` when:

- You need quick context.
- You are starting a new task.
- You want to brief an AI coding agent.
- You do not want to read all docs first.

## When Not to Use Brief

Do not use brief as the only source when implementing:

- Database migration.
- Payment webhook.
- Security logic.
- API contracts.
- RLS policy.
- Data import script.

For those, read the detailed folder.


---

# FILE: quick-prompt-for-ai-agent.md

# Quick Prompt for AI Coding Agent

Copy this into an AI coding agent when starting backend work.

```txt
You are working on SelaluTeh Chatbot CRM, an existing Express + React/Vite + MongoDB/Mongoose chatbot CRM that is being extended into a Telegram-first marketplace MVP.

Current system already has Telegram webhook, Meta webhook, AI agents, inbox/chats, contacts, human takeover, legacy orders/complaints, dashboard, and local file uploads.

Do not rebuild from scratch. Preserve existing CRM behavior.

Target MVP:
Telegram user can browse products, add to cart, checkout, receive payment link, complete sandbox payment, and receive paid notification. Admin can manage products, view orders, view payment status, and take over chats.

Important rules:
- Backend is source of truth for product/cart/order/payment.
- AI assists but cannot mark payment as paid or override order state.
- Payment webhook must be verified and idempotent.
- Every tenant-owned query must be workspace-scoped.
- Do not expose secrets.
- Do not break login, dashboard, inbox, Telegram webhook, AI reply, or human takeover.

Before payment work, prioritize:
1. Secure orders routes.
2. Secure complaints routes.
3. Protect/remove diagnostic routes.
4. Add webhook idempotency.
5. Add product catalog.
6. Add cart and checkout.

When you make changes, respond with:
- Summary
- Files changed
- Implementation notes
- Tests run/not run
- Risks
- Next recommended step
```
