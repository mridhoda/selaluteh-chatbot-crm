---

# FILE: README.md

# 00 Overview

Folder ini berisi dokumen overview untuk backend **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**.

Dokumen di folder ini adalah pintu masuk sebelum membaca folder lain seperti:

```txt
01-product
02-flows
03-business-rules
04-tech-spec
05-api-spec
06-data
08-security
09-ai-context
10-testing
11-sprint
```

## Purpose

Folder ini menjawab pertanyaan dasar:

- Project ini apa?
- Arah MVP-nya ke mana?
- Problem apa yang ingin diselesaikan?
- Scope MVP apa saja?
- Apa yang tidak termasuk MVP?
- Siapa stakeholder-nya?
- Apa KPI/success metrics-nya?
- Apa asumsi dan constraint utama?
- Kondisi sistem sekarang seperti apa?
- Target sistem ke depan seperti apa?

## Project Direction

Backend saat ini adalah **Chatbot CRM multi-platform** dengan:

- Telegram webhook.
- WhatsApp/Instagram webhook.
- AI agents.
- Inbox/chat history.
- Human takeover.
- Contacts.
- Orders/complaints legacy.
- MongoDB/Mongoose runtime.

Target baru:

```txt
Telegram-first single-merchant marketplace MVP
+ product catalog
+ cart
+ checkout
+ payment gateway sandbox
+ payment webhook
+ admin operations
+ AI shopping assistant
+ future Supabase/Postgres migration
```

## Recommended Reading Order

1. `project-summary.md`
2. `product-vision.md`
3. `scope.md`
4. `mvp-principles.md`
5. `goals-kpi.md`
6. `stakeholders.md`
7. `assumptions-constraints.md`
8. `current-state.md`
9. `target-state.md`
10. `risks-overview.md`
11. `decision-summary.md`
12. `glossary.md`

## Folder Boundary

This folder should stay high-level.

Do not put detailed API contracts, database schema, security implementation, or sprint tasks here. Put those in their own folders.


---

# FILE: project-summary.md

# Project Summary

## One-Liner

SelaluTeh Chatbot CRM is evolving into a **Telegram-first marketplace MVP** where customers can browse products, chat with an AI shopping assistant, checkout, pay through a sandbox payment gateway, and receive order updates inside Telegram.

## Current Product Type

The existing project is best understood as:

```txt
AI-powered chatbot CRM
```

It already supports:

- Customer chat inbox.
- AI agent replies.
- Human takeover.
- Connected platform configuration.
- Telegram inbound webhook.
- Meta/WhatsApp/Instagram inbound webhook.
- Contact management.
- Legacy order and complaint capture.
- Dashboard and analytics.

## New Product Direction

The next direction is:

```txt
Conversational commerce backend
```

Specifically:

```txt
Telegram customer
→ product browse
→ cart
→ checkout
→ payment link
→ payment webhook
→ paid order notification
→ admin order operations
```

## Why Telegram First

Telegram is chosen for MVP because:

- Existing app already supports Telegram chatbot behavior.
- Telegram supports bot commands and inline keyboard interactions.
- Telegram commerce flow can be tested faster than WhatsApp Business Cloud API.
- Payment can be handled via external payment link.
- It allows deterministic product/cart/checkout actions without forcing all logic through AI text parsing.

## MVP Business Model

The MVP is not a full multi-seller marketplace.

The MVP is:

```txt
Single-merchant commerce operated through Telegram bot and admin dashboard.
```

Future marketplace features such as multi-seller, seller wallet, commission, payout, and reviews are explicitly out of scope for the first MVP.

## Core User Value

For customers:

```txt
Buy products by chatting with a Telegram bot without opening a full web storefront.
```

For admin/business:

```txt
Manage chats, products, orders, payments, and customer support from one CRM dashboard.
```

For AI:

```txt
Assist customer questions and product recommendations while backend remains the source of truth for cart, order, and payment.
```

## Success Definition

The MVP succeeds if a user can complete this flow:

```txt
Open Telegram bot
→ view product list
→ add product to cart
→ checkout
→ receive payment link
→ complete sandbox payment
→ receive payment success notification
→ admin sees paid order
```


---

# FILE: product-vision.md

# Product Vision

## Vision Statement

Build a practical conversational commerce system that lets small businesses sell products through chat-first channels, starting with Telegram, while keeping CRM, AI support, product catalog, checkout, and payment operations in one backend.

## Product North Star

```txt
Make chat become a real selling channel, not just a customer support channel.
```

## Future Product Shape

The long-term product can become:

```txt
AI CRM + Conversational Marketplace Platform
```

Where a business can:

- Connect Telegram, WhatsApp, Instagram, and other platforms.
- Configure AI agents.
- Manage customer conversations.
- Manage product catalog.
- Accept orders.
- Accept payments.
- Track complaints.
- Switch between AI and human support.
- Automate follow-ups.
- Analyze conversion and support quality.

## MVP Vision

The first marketplace MVP should be intentionally narrow:

```txt
Telegram-first single-merchant marketplace
```

It should prove:

- Chat can drive product discovery.
- Telegram inline buttons can create a deterministic cart.
- Checkout can create real structured orders.
- Payment gateway sandbox can complete order lifecycle.
- Admin can operate the business from CRM.

## What Makes This Product Different

This product combines:

```txt
CRM inbox
+ AI assistant
+ human takeover
+ product catalog
+ checkout
+ payment webhook
```

Most chatbots only answer questions. This product should let customers complete a transaction while keeping admin in control.

## Key Product Principles

- Chat-first, not website-first.
- Backend is the source of truth.
- AI assists but does not own payment/order state.
- Admin dashboard remains operationally useful.
- MVP is single-merchant before multi-seller.
- Payment status comes only from payment gateway webhook or authorized admin action.
- Every data record must be workspace-scoped.


---

# FILE: scope.md

# Scope

## MVP Scope

The MVP focuses on a Telegram-first commerce experience built on the existing Chatbot CRM.

## In Scope

### Existing CRM Preservation

- Auth/login.
- Dashboard.
- Platforms.
- Agents.
- Inbox/chats.
- Contact management.
- Human takeover.
- AI reply.
- Legacy orders/complaints compatibility.

### Telegram Commerce

- `/start` menu.
- Product list.
- Product detail.
- Add to cart.
- View cart.
- Update quantity.
- Checkout confirmation.
- Payment link message.
- Order status message.

### Product Catalog

- Product category.
- Product.
- Product variant.
- Product status.
- Product image metadata.
- Admin product CRUD.

### Cart and Checkout

- Cart per Telegram customer/session.
- Cart items.
- Cart total calculation.
- Checkout confirmation.
- Pending order creation.
- Order items snapshot.

### Payment

- Payment provider abstraction.
- Sandbox payment link.
- Payment webhook endpoint.
- Signature verification.
- Payment event logging.
- Order status update after payment.
- Telegram paid notification.

### Admin Operations

- Product management.
- Order list.
- Order detail.
- Payment status.
- Customer chat context.
- Manual support through human takeover.

### Data Layer

- Preserve current MongoDB behavior initially.
- Prepare Supabase/Postgres migration path.
- Use workspace-scoped data.
- Keep large media in local server storage.
- Store file metadata in database.

## Out of Scope for MVP

- Multi-seller marketplace.
- Seller wallet.
- Seller payout.
- Commission engine.
- Review/rating system.
- Voucher/promo system.
- Logistics provider integration.
- Refund automation.
- Public web storefront.
- Native Telegram payment integration.
- Native WhatsApp payment.
- Advanced AI recommendation engine.
- Full Supabase Auth migration if not needed for MVP.

## Future Scope

After MVP:

- WhatsApp commerce.
- Instagram commerce.
- Multi-seller.
- Payout and commission.
- Advanced analytics.
- AI campaign generator.
- Customer segmentation.
- RAG-based product/FAQ knowledge base.
- Protected media endpoint.


---

# FILE: mvp-principles.md

# MVP Principles

## 1. Prove the Transaction Flow First

The MVP must prove:

```txt
chat → product → cart → checkout → payment → paid order
```

Do not optimize for advanced features before this works.

## 2. Single Merchant First

The MVP is single-merchant.

Avoid building:

- seller onboarding
- wallet seller
- payout
- commission
- seller dispute

Those are future marketplace features.

## 3. Backend Owns Commerce State

The backend must be the source of truth for:

- product price
- product status
- cart items
- checkout summary
- order status
- payment status
- inventory rules

AI must not become the source of truth.

## 4. AI Assists, Backend Validates

AI can:

- answer questions
- recommend products
- explain product details
- help user navigate checkout
- escalate to human

AI cannot:

- mark payment as paid
- create final order without backend validation
- override price
- ignore inventory/status
- bypass checkout confirmation

## 5. Preserve Existing CRM

Marketplace work must not break existing CRM features:

- login
- dashboard
- inbox
- platform connection
- AI agent
- human takeover
- contacts
- messages

## 6. Security Before Payment

Before payment work:

- orders API must be protected
- complaints API must be protected
- workspace isolation must exist
- webhook idempotency must exist
- diagnostic routes must be protected/removed

## 7. Payment Webhook Is Authoritative

Payment status should be updated from:

- verified payment webhook
- authorized admin action for manual mode

Never from user text or AI response.

## 8. Keep Storage Practical

Use local server storage for large media files.

Use database for metadata only.

## 9. Keep Documentation Modular

- Overview goes here.
- Product details go to `01-product`.
- Flows go to `02-flows`.
- Business rules go to `03-business-rules`.
- Tech architecture goes to `04-tech-spec`.
- API contracts go to `05-api-spec`.
- Database docs go to `06-data`.
- Security docs go to `08-security`.
- AI context goes to `09-ai-context`.
- Testing docs go to `10-testing`.
- Sprint docs go to `11-sprint`.


---

# FILE: goals-kpi.md

# Goals and KPI

## Product Goals

### Goal 1 — Enable Chat-Based Purchase

Customers should be able to complete a purchase flow from Telegram.

Target:

```txt
Telegram → product → cart → checkout → payment link → paid notification
```

### Goal 2 — Keep Admin in Control

Admin should be able to manage products, orders, payments, and customer chat from the dashboard.

### Goal 3 — Preserve Existing CRM

All existing core CRM features should continue to work while marketplace features are added.

### Goal 4 — Build Safe Payment Foundation

Payment status must be secure, webhook-driven, and idempotent.

### Goal 5 — Prepare Scalable Data Layer

The backend should be ready for Supabase/Postgres migration with workspace-scoped data and local media metadata.

## MVP Success Metrics

| Metric | Target for MVP |
|---|---:|
| Telegram product list response works | 100% in demo |
| Add-to-cart success rate | > 95% in test cases |
| Checkout creation success rate | > 95% in test cases |
| Payment webhook idempotency | 100% duplicate-safe |
| Paid order notification delivery | > 95% in test/staging |
| Admin can view paid order | 100% in demo |
| Existing login/dashboard smoke test | 100% pass |
| Existing Telegram basic AI reply | No regression |
| Cross-workspace access test | 0 known failures |
| Unauthenticated order access | 0 allowed |

## Engineering KPIs

| KPI | Target |
|---|---|
| P0 security issues before payment | 0 open |
| Public dangerous diagnostic routes | 0 |
| Service role exposed to frontend | 0 |
| Payment webhook without verification | 0 |
| Duplicate payment processing | 0 |
| Duplicate Telegram message handling | Idempotent |
| Missing workspace scope in tenant routes | 0 known P0 routes |

## Business KPIs After MVP

These are not required for technical MVP but should be tracked later:

- Number of Telegram conversations.
- Product view count.
- Add-to-cart count.
- Checkout started.
- Payment link clicked.
- Payment completed.
- Abandoned cart.
- Human takeover rate.
- AI resolution rate.
- Order completion time.


---

# FILE: assumptions-constraints.md

# Assumptions and Constraints

## Assumptions

### Product Assumptions

- MVP starts as single-merchant commerce.
- Telegram is the first customer-facing commerce channel.
- WhatsApp/Instagram remain CRM channels for now.
- Customer can use external payment link.
- Admin uses existing dashboard as the operations center.
- AI is helpful for product Q&A but deterministic buttons should drive checkout.

### Technical Assumptions

- Existing backend is Express-based.
- Existing frontend is React/Vite.
- Existing runtime database is MongoDB/Mongoose.
- Target data layer is Supabase/Postgres.
- Large media remains in local server storage.
- Payment gateway starts with sandbox mode.
- Backend controls payment creation and webhook validation.
- Telegram bot uses webhook.

### Data Assumptions

- Every workspace-owned row should have `workspace_id`.
- Current Mongo ObjectIds should not be reused as Postgres UUIDs.
- Migration requires ID mapping.
- File binaries remain outside Postgres.
- File metadata is stored in database.

## Constraints

### MVP Constraints

- Do not build multi-seller marketplace in MVP.
- Do not build wallet/payout in MVP.
- Do not build advanced logistics in MVP.
- Do not depend on AI for critical payment/order decisions.
- Do not require full frontend storefront.

### Security Constraints

- Payment webhook must be verified.
- Orders/complaints must require auth.
- Workspace isolation must be enforced.
- Service role key must remain server-side.
- Secrets must not be committed.
- Public file URLs must be intentionally accepted or replaced later with protected media endpoint.

### Operational Constraints

- Local uploads require persistent volume or backup.
- Webhooks require public HTTPS endpoint.
- Cutover from Mongo to Supabase requires maintenance window or dual-write strategy.
- Existing CRM behavior must not be broken by marketplace changes.

## Unknowns

- Final payment provider choice: Midtrans, Xendit, or manual sandbox abstraction.
- Whether Supabase Auth will replace custom JWT auth in first migration.
- Whether product images need protected access.
- Whether inventory is simple stock count or future reservation system.
- Whether WhatsApp commerce comes immediately after Telegram MVP or later.


---

# FILE: stakeholders.md

# Stakeholders

## Primary Stakeholders

### Business Owner / Admin

Responsible for:

- Managing products.
- Monitoring orders.
- Handling customer chats.
- Taking over AI conversations.
- Checking payment status.
- Resolving complaints.

Needs:

- Simple dashboard.
- Clear order/payment state.
- Easy product management.
- Reliable notifications.
- Safe manual override.

### Customer

Uses Telegram to:

- Start conversation.
- Browse products.
- Ask questions.
- Add to cart.
- Checkout.
- Pay through link.
- Receive order updates.
- Ask for help.

Needs:

- Fast response.
- Clear product choices.
- Simple cart.
- Trusted payment link.
- Clear confirmation.

### Human Agent / Support

Uses CRM inbox to:

- Take over chat.
- Reply manually.
- Resolve escalated issues.
- View customer context.

Needs:

- Chat history.
- Order context.
- Payment context.
- Clear AI/human mode.

### Developer / AI Coding Agent

Works on:

- Backend APIs.
- Database migration.
- Telegram bot flow.
- Payment integration.
- Tests.
- Documentation.

Needs:

- Clear docs.
- Do-not-break rules.
- Stable folder structure.
- Acceptance criteria.

## Secondary Stakeholders

### Payment Provider

Provides:

- Payment link.
- Payment status.
- Webhook event.
- Signature verification.

### Platform Providers

Telegram, WhatsApp/Meta, Instagram.

Provide:

- Messaging webhooks.
- Message sending APIs.
- Platform IDs and tokens.

### Infrastructure Operator

Responsible for:

- Deployment.
- Env/secrets.
- Logs.
- Backup.
- Local upload persistence.
- Webhook public URL.

## Stakeholder Priority

For MVP:

1. Customer can complete Telegram purchase.
2. Admin can operate product/order/payment.
3. Existing CRM users do not lose core behavior.
4. Developer can safely extend backend.


---

# FILE: current-state.md

# Current State

## Existing System

The current backend is an AI chatbot CRM.

It has:

- Express API.
- React/Vite dashboard.
- MongoDB/Mongoose models.
- JWT custom auth with OTP.
- Telegram webhook.
- Meta webhook for WhatsApp/Instagram.
- AI provider integration.
- AI agents.
- Contacts.
- Chats.
- Messages.
- Human takeover.
- Orders legacy.
- Complaints legacy.
- Local file upload.
- Dashboard/analytics.

## Existing Strengths

- Telegram integration already exists.
- CRM inbox already exists.
- Chat/message persistence already exists.
- Human takeover already exists.
- AI reply pipeline already exists.
- Contact model already exists.
- Platform connection model already exists.
- Dashboard exists.

## Existing Gaps

For marketplace MVP:

- No standalone product catalog.
- No cart.
- No checkout state.
- No normalized order items.
- No payment gateway sandbox.
- No payment webhook.
- No payment event log.
- No Telegram inline commerce flow.
- No product CRUD designed specifically for marketplace.
- No webhook idempotency.
- Orders/complaints security needs hardening.
- AI side effects need service-layer validation.

## Existing Risks

- Public or weakly protected legacy operation routes.
- Duplicate webhook processing.
- AI-driven order creation without deterministic cart/checkout.
- Local media persistence depends on deployment strategy.
- Migration from Mongo to Supabase needs careful ID mapping.


---

# FILE: target-state.md

# Target State

## Target MVP System

The target MVP is:

```txt
Telegram-first single-merchant marketplace built on existing Chatbot CRM.
```

## Target Customer Flow

```txt
Customer opens Telegram bot
→ sees welcome/menu
→ browses products
→ views product detail
→ adds item to cart
→ reviews cart
→ confirms checkout
→ receives payment link
→ pays via sandbox provider
→ receives payment success notification
```

## Target Admin Flow

```txt
Admin logs in
→ manages products
→ monitors chats
→ sees new orders
→ sees payment status
→ handles escalations
→ updates fulfillment status
```

## Target Backend Capabilities

- Secure auth and workspace isolation.
- Product catalog.
- Cart and cart item service.
- Checkout service.
- Orders with order items.
- Payment provider abstraction.
- Payment webhook verification.
- Payment events.
- Webhook event idempotency.
- Telegram inline keyboard flow.
- AI action guardrails.
- Local file storage metadata.

## Target Data Layer

Structured data:

```txt
Supabase/Postgres
```

Large media:

```txt
Local server storage
```

File metadata:

```txt
files table
```

## Target AI Role

AI should be:

```txt
assistant, not authority
```

AI can recommend and explain.

Backend must validate and execute commerce state changes.

## Target Non-MVP Future

- WhatsApp commerce.
- Multi-seller.
- Seller dashboard.
- Payout.
- Commission.
- Voucher.
- Logistics integration.
- Advanced analytics.
- RAG product knowledge base.


---

# FILE: non-goals.md

# Non-Goals

This document clarifies what the MVP should not try to solve.

## Not MVP

### Marketplace Complexity

- Multi-seller onboarding.
- Seller store pages.
- Seller wallet.
- Seller payout.
- Commission settlement.
- Seller disputes.
- Seller analytics.

### Advanced Commerce

- Voucher engine.
- Promotion engine.
- Dynamic pricing.
- Bundling.
- Loyalty points.
- Subscription commerce.
- Inventory reservation system.
- Warehouse management.
- Logistics provider automation.

### Payment Complexity

- Refund automation.
- Partial refund.
- Split payment.
- Escrow.
- Native wallet.
- Payout.
- Reconciliation dashboard.

### AI Complexity

- Fully autonomous sales agent.
- AI-controlled payment status.
- AI-generated product database without admin review.
- Advanced personalization/recommendation.
- Autonomous refund/dispute handling.

### Frontend Scope

- Full public web storefront.
- Mobile app.
- Customer account portal.
- Seller dashboard.

### Data Migration Scope

- Full Supabase Auth replacement if custom JWT remains enough for MVP.
- Moving all media into Supabase Storage.
- Rebuilding entire backend from scratch.

## Why Non-Goals Matter

The MVP must stay focused:

```txt
Telegram purchase flow + admin operations
```

Anything that delays this should be postponed.


---

# FILE: risks-overview.md

# Risks Overview

## Highest Risks

| Risk | Severity | Why It Matters | Mitigation |
|---|---|---|---|
| Payment spoofing | Critical | Fake paid orders | Verify payment webhook signature |
| Public orders/complaints | Critical | Data leak/modification | Add auth + workspace scope |
| Duplicate webhook | High | Duplicate message/order/payment | Add webhook_events/idempotency |
| AI creates invalid order | High | Wrong order/payment state | Backend validation + AI action guardrails |
| Local uploads lost | High | Broken media/payment proofs | Persistent volume + backup |
| Cross-workspace access | Critical | Tenant data leak | Workspace scope + RLS |
| Scope creep | Medium | MVP delay | Keep multi-seller out of MVP |
| Migration data loss | High | Broken production history | Dry run + validation + cutover plan |

## Product Risks

- User may not understand Telegram bot purchase flow.
- Payment link may reduce conversion if UX is unclear.
- Admin may need order fulfillment tools earlier than expected.
- AI may answer beyond available product data if guardrails are weak.

## Technical Risks

- Existing CRM regression.
- Mongo to Supabase migration complexity.
- Inconsistent workspace ownership.
- Long webhook processing without queue.
- Payment provider callback differences.

## Operational Risks

- Webhook public URL not stable.
- Server upload folder not persistent.
- Secrets accidentally exposed.
- Insufficient logging for payment/webhook failures.

## Risk Strategy

MVP should follow this priority:

```txt
security → deterministic commerce → payment → AI enhancement
```


---

# FILE: decision-summary.md

# Decision Summary

This document summarizes current major decisions.

## Decision 1 — Continue Existing Project

Decision:

```txt
Do not rebuild from scratch.
```

Reason:

Existing CRM already has Telegram webhook, AI agents, inbox, contacts, messages, human takeover, dashboard, and legacy orders/complaints.

## Decision 2 — Telegram First

Decision:

```txt
Build marketplace MVP on Telegram first.
```

Reason:

Telegram bot flow is easier to test with inline buttons and existing integration.

## Decision 3 — Single Merchant MVP

Decision:

```txt
Do not build multi-seller in MVP.
```

Reason:

Multi-seller introduces payout, commission, seller dashboard, dispute, and complex rules.

## Decision 4 — Backend Owns Commerce State

Decision:

```txt
Backend is source of truth for product, cart, order, and payment.
```

Reason:

AI output is not reliable enough for critical state.

## Decision 5 — Payment Link + Webhook

Decision:

```txt
Use external payment link from payment gateway sandbox.
```

Reason:

Simpler and realistic for Indonesia payment gateway flow.

## Decision 6 — Supabase/Postgres Target

Decision:

```txt
Migrate structured data to Supabase/Postgres.
```

Reason:

Marketplace/order/payment data benefits from relational consistency.

## Decision 7 — Local Storage for Media

Decision:

```txt
Keep large media in local server storage.
```

Reason:

Lower cost and existing app already uses local uploads.

## Decision 8 — Keep AI as Assistant

Decision:

```txt
AI helps users but cannot mark payment/order final states.
```

Reason:

Payment and order state must be validated by backend and provider webhook.


---

# FILE: success-metrics.md

# Success Metrics

This document expands success measurement beyond technical KPI.

## MVP Demo Success

The MVP demo is successful if:

- A Telegram user can browse products.
- A Telegram user can add product to cart.
- A Telegram user can checkout.
- A Telegram user can receive payment link.
- Payment sandbox webhook updates order.
- Telegram user receives payment confirmation.
- Admin can see the order and payment status.

## Product Success

| Metric | Meaning |
|---|---|
| Conversation to product view | Users can discover products |
| Product view to cart | Product flow is understandable |
| Cart to checkout | Checkout UX is clear |
| Checkout to paid | Payment link flow works |
| AI handoff rate | Measures where AI fails or support is needed |
| Human takeover resolution | Measures CRM value |

## Technical Success

| Metric | Target |
|---|---|
| Duplicate webhook processing | 0 critical duplicates |
| Payment spoofing incidents | 0 |
| Cross-workspace leaks | 0 |
| Existing CRM regression | 0 P0 regressions |
| Payment webhook processing reliability | > 99% in staging/demo |
| Order status consistency | 100% in test cases |

## Operational Success

- Admin does not need database access for normal order operations.
- Logs can explain failed payment/webhook events.
- Upload files survive deployment.
- Env configuration is documented.


---

# FILE: glossary.md

# Glossary

## AI Agent

Configured assistant that replies to customer messages based on prompt, behavior, knowledge, and business rules.

## Chat

Internal conversation between a customer/contact and a platform/agent.

## Contact

Customer identity from a platform such as Telegram, WhatsApp, or Instagram.

## Workspace

Tenant boundary for one business/account. All tenant-owned data should be workspace-scoped.

## Human Takeover

State where a human agent takes over a chat and AI stops replying.

## Product

Sellable item shown to Telegram customer.

## Product Variant

Specific purchasable option of a product, such as size, flavor, or package.

## Cart

Temporary collection of items selected by a customer before checkout.

## Checkout

Confirmed step that validates cart and prepares an order.

## Order

Structured record of customer purchase.

## Order Item

Snapshot of product/variant/price/quantity inside an order.

## Payment

Payment transaction created for an order.

## Payment Event

Raw/normalized event received from payment provider webhook.

## Webhook Event

Stored external event used for idempotency and debugging.

## Payment Link

URL generated by payment provider for customer payment.

## Sandbox

Testing mode where payment can be simulated without real money.

## RLS

Row Level Security, Supabase/Postgres mechanism to restrict row access.

## Local Storage

Server filesystem used to store large media files, while database stores metadata.


---

# FILE: overview-map.md

# Overview Map

This document maps overview docs to more detailed folders.

## Map

| If you need... | Read overview file | Then read |
|---|---|---|
| What is this project? | `project-summary.md` | `04-tech-spec/architecture.md` |
| Where is product going? | `product-vision.md` | `01-product/product-vision.md` |
| What is in MVP? | `scope.md` | `01-product/mvp-scope.md` |
| How should MVP be built? | `mvp-principles.md` | `11-sprint/sprint-plan.md` |
| How to measure success? | `goals-kpi.md` | `10-testing/acceptance-test-cases.md` |
| Who uses it? | `stakeholders.md` | `01-product/user-personas.md` |
| What can go wrong? | `risks-overview.md` | `08-security/threat-model.md` |
| What has been decided? | `decision-summary.md` | `04-tech-spec/decision-log.md` |
| What is current status? | `current-state.md` | `11-sprint/implementation-status.md` |
| What is target system? | `target-state.md` | `06-data/database-schema.md` |

## Rule

Overview docs should not duplicate implementation-level details. They should point to detail docs.
