---

# FILE: 00-overview/project-summary.md

# Project Summary

SelaluTeh Chatbot CRM is an existing AI Chatbot CRM being extended into a Telegram-first marketplace MVP.

## Existing System

- Express backend
- React/Vite admin dashboard
- MongoDB/Mongoose runtime
- Telegram webhook
- WhatsApp/Instagram/Meta webhook support
- AI agents
- Inbox/chats/messages
- Human takeover
- Contacts
- Legacy orders and complaints
- Local file storage

## Updated Product Direction

MVP:

```txt
single workspace/account
multiple outlets
Telegram-first ordering
```

Future production:

```txt
multi workspace/account/franchise owner
each workspace has multiple outlets
```

## MVP Customer Flow

```txt
Telegram /start
→ select outlet
→ browse outlet products
→ add to cart
→ checkout
→ receive payment link
→ payment webhook updates order
→ customer receives notification
```

## Admin Flow

```txt
Admin dashboard
→ filter by outlet
→ manage products/availability
→ monitor orders/payments
→ handle chats
→ assign staff to outlets
```


---

# FILE: 00-overview/scope.md

# Scope

## MVP Scope

- One workspace/account for SelaluTeh.
- Multiple outlets under that workspace.
- Outlet selection in Telegram.
- Outlet-aware product listing.
- Outlet-bound cart.
- Outlet-bound checkout/order/payment.
- Outlet filter in dashboard pages.
- Outlet access permissions for users/staff.
- Product availability per outlet.

## Future Production Scope

- Multiple workspaces/accounts/franchise owners.
- Each workspace can manage multiple outlets.
- Workspace-level billing.
- Workspace-level platform/payment credentials.
- Franchise-owner isolation.
- Workspace switcher in dashboard.
- Outlet selector inside each workspace.

## Out of Scope for MVP

- Franchise self-service onboarding.
- Multi-workspace billing UI.
- Commission/payout.
- Logistics automation.
- Refund automation.
- Full public storefront.
- Full Telegram Mini App.


---

# FILE: 00-overview/target-state.md

# Target State

## MVP Target

```txt
Workspace: SelaluTeh
  ├── Outlet Samarinda
  ├── Outlet Tenggarong
  └── Outlet Bontang
```

Owner/admin can view all outlets. Outlet manager/human agent can access assigned outlets.

## Future Target

```txt
Platform
  ├── Workspace A / Franchise Owner A
  │     ├── Outlet A1
  │     └── Outlet A2
  └── Workspace B / Franchise Owner B
        ├── Outlet B1
        └── Outlet B2
```

## Technical Target

Every authenticated request resolves:

```txt
user
workspace membership
allowed outlet ids
requested outlet id/filter
```

APIs must validate access before returning or mutating data.


---

# FILE: 01-product/mvp-scope.md

# MVP Scope

The MVP is a **multi-outlet Telegram ordering system** under one workspace/account.

## Included

- Outlet management.
- User outlet access.
- Product catalog.
- Product availability per outlet.
- Telegram outlet selection.
- Outlet-bound cart/checkout/order/payment.
- Orders page with outlet filter.
- Payments page with outlet filter.
- Chats with outlet context.
- Basic outlet analytics.

## Prepared for Future

- Multi-workspace/account/franchise owner.
- Workspace-level credentials/billing.
- Workspace switcher.
- Franchise owner data isolation.

## Not Included Yet

- Franchise onboarding.
- Payout/commission.
- Separate billing per franchise owner.
- Public web storefront.


---

# FILE: 01-product/requirements.md

# Product Requirements

## Outlet Requirements

Admin can:

- create outlet
- edit outlet
- activate/deactivate outlet
- set address/contact/opening hours
- assign staff to outlet
- view outlet-specific orders/payments/chats

## Commerce Requirements

Customer must:

- select outlet before commerce
- see only products available at selected outlet
- add items to outlet-bound cart
- checkout into outlet-bound order
- receive payment link
- receive payment/order notification

## Product Availability Requirements

Product is workspace-owned. Availability is outlet-specific.

Fields may include:

```txt
is_available
price_override
stock_quantity
status
```

## Permission Requirements

- Owner/admin sees all outlets in workspace.
- Outlet manager sees assigned outlets.
- Human agent handles assigned outlet chats/orders.
- Future franchise owner sees only their workspace.


---

# FILE: 01-product/user-personas.md

# User Personas

## Workspace Owner / Franchise Owner

Owns a workspace/account. Can manage all outlets under that workspace.

## Workspace Admin

Operates workspace-level settings, products, outlets, users, channels, AI, and payments.

## Outlet Manager

Operates assigned outlet(s). Can process orders and monitor outlet performance.

## Human Agent

Handles chats/orders for assigned outlet(s).

## Customer

Uses Telegram/WhatsApp to select outlet, browse products, order, pay, and receive updates.

## Platform Admin

Future role that manages multiple workspaces across the SaaS platform.


---

# FILE: 02-flows/checkout-flow.md

# Checkout Flow

## Outlet-Aware Checkout

Checkout is created from a cart with:

```txt
workspace_id
outlet_id
contact_id
chat_id
```

## Steps

1. Customer clicks checkout.
2. Backend loads active cart.
3. Backend validates outlet_id exists.
4. Backend validates outlet is active.
5. Backend validates all products are available at outlet.
6. Backend recalculates totals.
7. Backend creates checkout.
8. Backend creates order.
9. Backend creates payment link.
10. Backend sends payment link.

## Failure Cases

- no outlet selected
- outlet inactive
- product unavailable
- cart outlet mismatch
- payment provider unavailable


---

# FILE: 02-flows/outlet-selection-flow.md

# Outlet Selection Flow

## Purpose

Customer must select an outlet before product browsing/cart/checkout.

## Flow

```txt
/start
→ backend resolves workspace from platform/bot
→ upsert contact/chat
→ check active outlet context
→ if missing, show active outlets
→ customer selects outlet
→ save chat.current_outlet_id
→ show commerce menu
```

## Telegram Example

```txt
Halo kak 👋 Pilih outlet dulu ya:

[SelaluTeh Samarinda]
[SelaluTeh Tenggarong]
[SelaluTeh Bontang]
```

After selection:

```txt
Kamu memilih SelaluTeh Tenggarong ✅

[Lihat Produk]
[Keranjang]
[Status Pesanan]
[Ubah Outlet]
```

## Rules

- No product list without outlet.
- No cart without outlet.
- No checkout without outlet.
- Switching outlet with non-empty cart requires confirmation.


---

# FILE: 02-flows/payment-flow.md

# Payment Flow

## Outlet-Aware Payment

Payment belongs to:

```txt
workspace_id
outlet_id
order_id
checkout_id
```

## Flow

```txt
order pending_payment
→ create provider transaction/payment link
→ send payment link
→ webhook received
→ verify signature
→ idempotency check
→ update payment
→ update order
→ notify customer
```

## Rule

Payment must update the order in the same workspace and outlet.

Future production may use workspace-specific payment credentials.


---

# FILE: 02-flows/telegram-commerce-flow.md

# Telegram Commerce Flow

## Updated Multi-Outlet Flow

```txt
/start
→ select outlet
→ list products available in outlet
→ view product
→ add to cart
→ cart bound to outlet
→ checkout
→ order bound to outlet
→ payment link sent
→ payment webhook updates order/payment
→ Telegram notification
```

## Required Context

Every commerce action must carry:

```txt
workspace_id
platform_id
chat_id
contact_id
active_outlet_id
```

## AI Role

AI may assist conversation and recommendation, but all commerce actions must go through backend services.

AI cannot:

- checkout without outlet
- offer unavailable outlet product
- mark payment paid
- change outlet without confirmation


---

# FILE: 03-business-rules/cart-checkout-rules.md

# Cart and Checkout Rules

## Cart Rule

Cart is bound to one outlet:

```txt
cart.workspace_id
cart.outlet_id
cart.contact_id
```

## Add Item

Backend validates:

- outlet exists and active
- product belongs to workspace
- product available at outlet
- cart outlet matches active outlet
- price computed server-side

## Checkout Rule

Checkout copies outlet_id from cart and revalidates:

- outlet status
- product availability
- price
- stock if enabled
- cart ownership/contact

## Forbidden

- checkout without outlet
- mixed-outlet cart
- client-supplied totals


---

# FILE: 03-business-rules/order-rules.md

# Order Rules

## Required Fields

Every marketplace order must have:

```txt
workspace_id
outlet_id
contact_id
chat_id optional
status
payment_status
total_amount
```

## MVP Statuses

```txt
pending_payment
paid
processing
completed
cancelled
```

## Access Rule

User can view/update order only if:

- user belongs to workspace
- user has access to order.outlet_id, or has all-outlet role
- role permits action

## Status Actions

pending_payment:

- resend payment link
- cancel order
- open chat

paid:

- mark processing
- open chat

processing:

- mark completed
- open chat

completed/cancelled:

- view only, unless owner override


---

# FILE: 03-business-rules/outlet-access-rules.md

# Outlet Access Rules

## Access Layers

```txt
workspace membership
→ outlet access
→ action permission
```

## Roles

Workspace-level:

```txt
owner
admin
finance
support_manager
viewer
```

Outlet-level:

```txt
outlet_manager
human_agent
viewer
```

## Rules

Owner/admin:

- can access all outlets in workspace
- can assign users to outlets
- can view all orders/payments/chats

Outlet manager:

- can access assigned outlet(s)
- can process orders for assigned outlet(s)

Human agent:

- can handle assigned outlet chats/orders

## Backend Rule

Never trust frontend outlet_id alone.

Backend must validate:

```txt
authenticated user
workspace membership
outlet belongs to workspace
user has outlet access
role permits action
```

Unauthorized outlet access returns 403 or 404.


---

# FILE: 03-business-rules/outlet-rules.md

# Outlet Rules

## Core Rule

Workspace/account represents business owner or franchise owner.

Outlet represents physical branch/cabang under workspace.

## MVP Rule

MVP has one workspace with many outlets.

## Future Rule

Future production has many workspaces, each with many outlets.

## Commerce Rules

- Customer must select an active outlet before commerce.
- Cart belongs to exactly one outlet.
- Checkout copies outlet_id from cart.
- Order belongs to exactly one outlet.
- Payment belongs to the same outlet as order.
- Product must be available at selected outlet to be shown/orderable.

## Outlet Change Rule

If customer changes outlet while cart has items:

- clear cart and switch, or
- keep current outlet

Cart must not mix products from different outlets.

## Order Transfer Rule

Avoid changing outlet after payment. If allowed, require owner/admin, reason, audit log, and customer notification if needed.


---

# FILE: 03-business-rules/payment-rules.md

# Payment Rules

## Outlet-Aware Payment

```txt
payments.workspace_id = orders.workspace_id
payments.outlet_id = orders.outlet_id
```

## Source of Truth

Payment status comes from:

- payment provider webhook
- explicit authorized admin override

AI cannot mark payment paid.

## Webhook Processing

Must:

- verify signature
- enforce idempotency
- find payment/order
- validate amount
- update payment
- update order
- notify customer

## Manual Override

If enabled, require:

- owner/admin role
- reason
- proof/reference
- audit log


---

# FILE: 03-business-rules/product-catalog-rules.md

# Product Catalog Rules

## Product Ownership

Product is owned by workspace.

```txt
products.workspace_id
```

## Outlet Availability

Product visibility/orderability is controlled by:

```txt
product_outlet_availability
```

Fields:

```txt
workspace_id
product_id
outlet_id
is_available
price_override
stock_quantity
status
```

## Customer Product List Rule

Product appears in Telegram only if:

- product belongs to workspace
- product.status = active
- product.telegram_visible = true
- outlet is active
- product is available in selected outlet

## Price Rule

Backend calculates price.

Use:

```txt
price_override if exists
else product.base_price
```


---

# FILE: 04-tech-spec/architecture.md

# Architecture

## Updated Architecture

```txt
Platform
  └── Workspace / Account / Franchise Owner
        └── Outlet / Branch
              └── Cart
              └── Checkout
              └── Order
              └── Payment
```

## MVP

The UI may only show one workspace, but backend must still use workspace-aware design.

## Future Production

Multiple franchise owners can have separate workspaces. Each workspace can have many outlets.

## Request Context

Every authenticated request should resolve:

```txt
user
workspace membership
allowed outlet ids
requested outlet id
```

## Service Modules

Recommended:

- WorkspaceService
- OutletService
- AccessControlService
- ProductAvailabilityService
- CartService
- CheckoutService
- OrderService
- PaymentService
- TelegramCommerceService
- WebhookEventService

## Rule

Do not hardcode a single workspace or treat outlet as account.


---

# FILE: 04-tech-spec/database-access.md

# Database Access

## Required Context

Repositories should receive:

```txt
workspaceId
allowedOutletIds
requestedOutletId optional
```

## Example

```txt
findOrders({
  workspaceId,
  allowedOutletIds,
  requestedOutletId,
  filters
})
```

## Never Trust

```txt
req.body.workspace_id
req.query.workspace_id
req.query.outlet_id without validation
```

## Required Helpers

- requireWorkspaceAccess(userId, workspaceId)
- requireOutletAccess(userId, workspaceId, outletId)
- getAllowedOutletIds(userId, workspaceId)
- assertOutletBelongsToWorkspace(outletId, workspaceId)


---

# FILE: 04-tech-spec/decision-log.md

# Decision Log

## Decision: MVP Single Workspace + Multi Outlet

Status: Accepted

MVP will use one workspace/account with many outlets.

## Decision: Future Multi Workspace + Multi Outlet

Status: Accepted

Future production must support multiple accounts/franchise owners, each with multiple outlets.

## Decision: Workspace Is Account, Outlet Is Branch

Status: Accepted

Workspace represents business owner/franchise owner. Outlet represents physical branch.

## Decision: workspace_id Everywhere Tenant-Owned

Status: Accepted

All tenant-owned data must include workspace_id.

## Decision: outlet_id for Outlet Operations

Status: Accepted

Cart, checkout, order, payment, complaints, and relevant chats must include outlet context.

## Decision: Customer Selects Outlet First

Status: Accepted for MVP

Reason: faster than location routing and clearer for first implementation.


---

# FILE: 05-api-spec/orders-api.md

# Orders API

## List Orders

```http
GET /api/orders
```

Query:

```txt
outlet_id
order_status
payment_status
platform
date_from
date_to
search
page
limit
```

## Row Fields

```json
{
  "id": "ord_123",
  "order_number": "ORD-00124",
  "outlet": {
    "id": "outlet_123",
    "name": "SelaluTeh Tenggarong"
  },
  "customer": {},
  "total_amount": 75000,
  "order_status": "pending_payment",
  "payment_status": "pending"
}
```

## Detail Must Include

- customer info
- outlet info
- order items
- payment summary
- timeline
- related chat

## Rule

Order update requires outlet access.


---

# FILE: 05-api-spec/outlet-access-api.md

# Outlet Access API

## Get User Outlet Access

```http
GET /api/users/:user_id/outlet-access
```

## Update User Outlet Access

```http
PUT /api/users/:user_id/outlet-access
```

Body:

```json
{
  "all_outlets": false,
  "outlets": [
    {
      "outlet_id": "outlet_123",
      "role": "outlet_manager"
    }
  ]
}
```

## Get My Outlet Access

```http
GET /api/me/outlet-access
```

Used by frontend to render outlet selector.

## Rules

- user must be workspace member first
- outlet must belong to workspace
- only owner/admin can assign access


---

# FILE: 05-api-spec/outlets-api.md

# Outlets API

## List Outlets

```http
GET /api/outlets
```

Query:

```txt
status
search
page
limit
```

## Create Outlet

```http
POST /api/outlets
```

Body:

```json
{
  "name": "SelaluTeh Tenggarong",
  "code": "TGR",
  "address": "Jl. Example",
  "phone": "+62...",
  "status": "active",
  "opening_hours": {}
}
```

Permission:

```txt
workspace owner/admin
```

## Update Outlet

```http
PUT /api/outlets/:outlet_id
```

## Change Status

```http
PATCH /api/outlets/:outlet_id/status
```

## Rules

- outlet must belong to current workspace
- inactive outlet should not receive new customer orders
- archived outlet hidden from customer-facing list


---

# FILE: 05-api-spec/overview.md

# API Overview

## Updated API Context

APIs must support:

```txt
MVP: one workspace + many outlets
Future: many workspaces + many outlets each
```

## Common Query Params

```txt
outlet_id
status
search
date_from
date_to
page
limit
sort
```

## New API Groups

- Outlets API
- Outlet Access API
- Product Outlet Availability API

## Access Rule

Backend derives workspace from authenticated context and validates outlet access server-side.

Unauthorized outlet access returns 403 or 404.


---

# FILE: 05-api-spec/payments-api.md

# Payments API

## List Payments

```http
GET /api/payments
```

Query:

```txt
outlet_id
status
provider
date_from
date_to
search
page
limit
```

## Payment Fields

```json
{
  "id": "pay_123",
  "workspace_id": "ws_123",
  "outlet_id": "outlet_123",
  "order_id": "ord_123",
  "provider": "midtrans",
  "amount": 75000,
  "status": "pending",
  "payment_link": "https://..."
}
```

## Rule

Viewing payment requires access to payment outlet.


---

# FILE: 05-api-spec/products-api.md

# Products API

## List Products

```http
GET /api/products
```

Query:

```txt
outlet_id
status
category_id
search
telegram_visible
page
limit
```

## Behavior

- without outlet_id: list workspace products
- with outlet_id: include outlet availability
- customer-facing list requires outlet_id

## Update Outlet Availability

```http
PUT /api/products/:product_id/outlet-availability
```

Body:

```json
{
  "outlets": [
    {
      "outlet_id": "outlet_123",
      "is_available": true,
      "price_override": null,
      "stock_quantity": 20
    }
  ]
}
```


---

# FILE: 06-data/database-schema.md

# Database Schema

## Architecture Mode

```txt
MVP: one workspace, many outlets
Future: many workspaces/accounts/franchise owners, each with many outlets
```

## Core Tables

### workspaces

Represents business account/franchise owner.

### outlets

Represents physical branch under workspace.

Suggested fields:

```txt
id
workspace_id
name
code
address
phone
status
timezone
opening_hours
metadata
created_at
updated_at
```

### user_workspace_memberships

Represents user role inside a workspace.

Suggested fields:

```txt
id
workspace_id
user_id
role
status
created_at
updated_at
```

### user_outlet_access

Represents user access to a specific outlet.

Suggested fields:

```txt
id
workspace_id
outlet_id
user_id
role
status
created_at
updated_at
```

### product_outlet_availability

Represents product availability per outlet.

Suggested fields:

```txt
id
workspace_id
product_id
outlet_id
is_available
price_override
stock_quantity
status
created_at
updated_at
```

## Add outlet_id To

```txt
carts
checkouts
orders
payments
complaints
```

Optional:

```txt
chats.current_outlet_id
contacts.last_outlet_id
```

## Rule

All tenant-owned data must include workspace_id.

Outlet-operational data must include outlet_id.


---

# FILE: 06-data/entities.md

# Entities

## Workspace

Business account or franchise owner.

## Outlet

Physical branch/cabang under workspace.

## User Workspace Membership

Role of user inside workspace.

## User Outlet Access

Permission of user for one outlet.

## Product

Workspace-owned product.

## Product Outlet Availability

Availability, optional outlet price override, optional stock.

## Cart

Customer cart bound to workspace/outlet/contact.

## Checkout

Created from outlet-bound cart.

## Order

Transaction bound to workspace/outlet.

## Payment

Payment bound to order/workspace/outlet.

## Chat

Conversation with optional current outlet context.


---

# FILE: 06-data/erd.md

# ERD

```txt
USERS
  │
  ├── USER_WORKSPACE_MEMBERSHIPS ── WORKSPACES ── OUTLETS
  │                                  │              │
  └── USER_OUTLET_ACCESS ────────────┘              │
                                                     │
WORKSPACES ── PRODUCTS ── PRODUCT_OUTLET_AVAILABILITY ── OUTLETS
                                                     │
CONTACTS ── CHATS ── CARTS ── CHECKOUTS ── ORDERS ── PAYMENTS
```

Key rule:

```txt
workspace_id = tenant boundary
outlet_id = operational branch boundary
```


---

# FILE: 06-data/indexes.md

# Indexes

Recommended indexes:

```sql
create index idx_outlets_workspace_id on outlets(workspace_id);
create index idx_user_workspace_memberships_user on user_workspace_memberships(user_id);
create index idx_user_workspace_memberships_workspace on user_workspace_memberships(workspace_id);
create index idx_user_outlet_access_user_workspace on user_outlet_access(user_id, workspace_id);
create index idx_user_outlet_access_outlet on user_outlet_access(outlet_id);
create index idx_product_outlet_availability_workspace_outlet on product_outlet_availability(workspace_id, outlet_id);
create index idx_product_outlet_availability_product on product_outlet_availability(product_id);
create index idx_orders_workspace_outlet_created on orders(workspace_id, outlet_id, created_at desc);
create index idx_payments_workspace_outlet_created on payments(workspace_id, outlet_id, created_at desc);
```


---

# FILE: 06-data/migration-plan.md

# Migration Plan

## Phase 1 — Foundation

- Add outlets table.
- Add user_workspace_memberships if missing.
- Add user_outlet_access.
- Add product_outlet_availability.

## Phase 2 — Backfill MVP Workspace

- Create default SelaluTeh workspace.
- Assign existing users to workspace.
- Create initial outlets.
- Map legacy data to workspace.

## Phase 3 — Add Outlet IDs

Add outlet_id to:

- carts
- checkouts
- orders
- payments
- complaints
- chats current outlet optional

## Phase 4 — Update Services/API/UI

- outlet access validation
- outlet filters
- outlet selection flow
- product availability per outlet

## Phase 5 — Tests

- workspace isolation
- outlet isolation
- cart outlet binding
- payment webhook outlet mapping


---

# FILE: 06-data/migrations/sql/009_multi_workspace_outlet_foundation.sql

-- 009_multi_workspace_outlet_foundation.sql
-- Review against existing schema before running.

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  code text,
  address text,
  phone text,
  status text not null default 'active',
  timezone text default 'Asia/Makassar',
  opening_hours jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, code)
);

create table if not exists user_workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create table if not exists user_outlet_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'outlet_viewer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, outlet_id, user_id)
);

create table if not exists product_outlet_availability (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  is_available boolean not null default true,
  price_override integer,
  stock_quantity integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, product_id, outlet_id)
);

alter table carts add column if not exists outlet_id uuid references outlets(id);
alter table checkouts add column if not exists outlet_id uuid references outlets(id);
alter table orders add column if not exists outlet_id uuid references outlets(id);
alter table payments add column if not exists outlet_id uuid references outlets(id);
alter table complaints add column if not exists outlet_id uuid references outlets(id);
alter table chats add column if not exists current_outlet_id uuid references outlets(id);

create index if not exists idx_outlets_workspace_id on outlets(workspace_id);
create index if not exists idx_user_workspace_memberships_user on user_workspace_memberships(user_id);
create index if not exists idx_user_workspace_memberships_workspace on user_workspace_memberships(workspace_id);
create index if not exists idx_user_outlet_access_user_workspace on user_outlet_access(user_id, workspace_id);
create index if not exists idx_user_outlet_access_outlet on user_outlet_access(outlet_id);
create index if not exists idx_product_outlet_availability_workspace_outlet on product_outlet_availability(workspace_id, outlet_id);
create index if not exists idx_product_outlet_availability_product on product_outlet_availability(product_id);
create index if not exists idx_orders_workspace_outlet_created on orders(workspace_id, outlet_id, created_at desc);
create index if not exists idx_payments_workspace_outlet_created on payments(workspace_id, outlet_id, created_at desc);


---

# FILE: 06-data/query-contracts.md

# Query Contracts

## Required Query Context

All tenant queries require:

```txt
workspace_id
```

Outlet-specific queries require:

```txt
outlet_id or allowed_outlet_ids
```

## Orders Query

```txt
findOrders({
  workspaceId,
  allowedOutletIds,
  requestedOutletId,
  filters
})
```

## Products Query

Customer-facing:

```txt
findProductsForOutlet({
  workspaceId,
  outletId,
  activeOnly: true,
  telegramVisible: true
})
```

## Payments Query

```txt
findPayments({
  workspaceId,
  allowedOutletIds,
  requestedOutletId
})
```

If requestedOutletId is not allowed, return 403.


---

# FILE: 06-data/relationships.md

# Relationships

```txt
workspaces 1 ── * outlets
workspaces 1 ── * user_workspace_memberships
users 1 ── * user_workspace_memberships

outlets 1 ── * user_outlet_access
users 1 ── * user_outlet_access

workspaces 1 ── * products
products 1 ── * product_outlet_availability
outlets 1 ── * product_outlet_availability

outlets 1 ── * carts
outlets 1 ── * checkouts
outlets 1 ── * orders
outlets 1 ── * payments
```

Commerce chain:

```txt
workspace → outlet → cart → checkout → order → payment
```


---

# FILE: 06-data/rls-policies.md

# RLS Policies

## Goal

Protect by:

```txt
workspace isolation
+
outlet access isolation
```

## Workspace Rule

User can access workspace data only if they have active workspace membership.

## Outlet Rule

For outlet-specific rows, user must:

- be workspace owner/admin, or
- have active user_outlet_access for row.outlet_id

## Service Role Caveat

If backend uses service role, app-layer authorization is still mandatory.


---

# FILE: 06-data/seed-data.md

# Seed Data

## MVP Seed

Workspace:

```txt
SelaluTeh HQ
```

Outlets:

```txt
SelaluTeh Samarinda
SelaluTeh Tenggarong
SelaluTeh Bontang
```

Users:

```txt
Owner
Admin
Outlet Manager Samarinda
Outlet Manager Tenggarong
Human Agent Bontang
```

Product examples:

```txt
Salty Caramel
Milk Tea
Americano
Tumbler
```

Availability example:

```txt
Salty Caramel → all outlets
Milk Tea → Samarinda/Tenggarong
Americano → Samarinda only
Tumbler → all outlets
```


---

# FILE: 07-uiux/orders-page-multi-outlet.md

# Orders Page — Multi-Outlet UX

## Layout

```txt
Header
Summary cards
Filter toolbar
Orders table
Order detail panel
```

## Required Filters

```txt
Outlet
Order Status
Payment Status
Platform
Date Range
Search
Needs Attention
```

## Table Columns

```txt
Order ID
Customer
Outlet
Platform
Items
Total
Order Status
Payment Status
Created At
Actions
```

## Detail Panel

Sections:

- Customer Info
- Outlet Info
- Order Items
- Payment Summary
- Timeline
- Quick Actions

## Outlet Info

Show:

```txt
Outlet Name
Outlet Address
Outlet Contact
Outlet Status
```

## Summary Cards

Should follow selected outlet filter:

- Total Orders
- Pending Payment
- Ready to Process
- Needs Attention


---

# FILE: 07-uiux/outlet-selector-pattern.md

# Outlet Selector Pattern

## Owner/Admin

Show:

```txt
Outlet: All Outlets ▼
```

Dropdown:

```txt
All Outlets
SelaluTeh Samarinda
SelaluTeh Tenggarong
SelaluTeh Bontang
```

## Outlet Manager

If user has one outlet:

```txt
Outlet: SelaluTeh Samarinda
```

Can be locked/read-only.

## Rule

Only show outlets user can access.

Backend must still validate outlet access.


---

# FILE: 07-uiux/outlet-ui-requirements.md

# Outlet UI Requirements

## MVP UI

Show outlet filter/selector.

Workspace switcher can be hidden because MVP has one workspace.

## Future UI

Show:

```txt
Workspace Switcher
Outlet Selector
```

## Pages Requiring Outlet Filter

- Orders
- Payments
- Products
- Chats
- Contacts
- Analytics
- Complaints

## Orders Page

Must include:

- outlet filter
- outlet column
- outlet info in detail panel
- outlet-aware summary cards
- outlet-based permissions

## Products Page

Must include:

- outlet availability controls
- available outlets checklist
- optional price/stock per outlet

## Team/Human Agents Page

Must include:

- workspace role
- outlet access assignment


---

# FILE: 08-security/outlet-access-security.md

# Outlet Access Security

## Threat

A user changes URL/query:

```txt
/orders?outlet_id=other_outlet
```

## Required Validation

For every outlet-scoped request:

1. user authenticated
2. user belongs to workspace
3. outlet belongs to workspace
4. user has outlet access or all-outlet role
5. action is allowed

## Applies To

- orders
- payments
- carts
- checkouts
- chats
- complaints
- analytics
- product availability

## Error

Unauthorized outlet access:

```txt
403 Forbidden
```


---

# FILE: 08-security/security-checklist.md

# Security Checklist

## Workspace

- [ ] Tenant data has workspace_id.
- [ ] API does not trust client workspace_id.
- [ ] Workspace membership is checked.
- [ ] Multi-workspace future is not hardcoded away.

## Outlet

- [ ] Outlet belongs to workspace.
- [ ] User has outlet access or all-outlet role.
- [ ] Orders are filtered by allowed outlet ids.
- [ ] Payments are filtered by allowed outlet ids.
- [ ] Chats are filtered by allowed outlet ids.
- [ ] Product availability changes require permission.
- [ ] Cross-outlet access returns 403/404.

## Payment

- [ ] Webhook signature verified.
- [ ] Webhook idempotency implemented.
- [ ] Payment maps to correct order/outlet.
- [ ] Amount verified.

## AI

- [ ] AI cannot checkout without outlet.
- [ ] AI cannot offer unavailable products.
- [ ] AI cannot mark payment paid.


---

# FILE: 08-security/workspace-tenant-security.md

# Workspace Tenant Security

## Tenant Boundary

Workspace is the tenant/account boundary.

MVP has one workspace, but code must support many workspaces later.

## Rule

User can access workspace data only if they have active workspace membership.

## Dangerous Pattern

```txt
GET /orders?workspace_id=other_workspace
```

Backend must not trust client-supplied workspace_id.

## Required Checks

- user authenticated
- user active
- user has active workspace membership
- role permits action
- row belongs to workspace


---

# FILE: 09-ai-context/commerce-agent-guardrails.md

# Commerce Agent Guardrails

## Outlet Context Required

AI must check active outlet before:

- product recommendation
- add to cart
- checkout

## Product Recommendation

AI may only recommend:

- active products
- telegram-visible products
- products available in active outlet

## Payment

AI can explain payment link, but payment success comes from provider webhook.


---

# FILE: 09-ai-context/outlet-context.md

# Outlet Context

## Core Concept

MVP has one workspace and many outlets.

Future production has many workspaces, each with many outlets.

## AI Rules

AI must not:

- create cart before outlet selection
- checkout before outlet selection
- recommend unavailable outlet products
- switch outlet without confirmation
- mark payment paid
- change order outlet without authorized flow

## Required Runtime Context

```txt
workspace_id
chat_id
contact_id
active_outlet_id
cart state
allowed product list
```


---

# FILE: 09-ai-context/prompt-context.md

# Prompt Context

You are working on SelaluTeh Chatbot CRM backend.

## Latest Architecture

MVP:

```txt
single workspace/account
multiple outlets
```

Future production:

```txt
multiple workspaces/accounts/franchise owners
each workspace has multiple outlets
```

## Definitions

Workspace = account/business/franchise owner.

Outlet = physical branch/cabang.

## Preserve Existing System

- auth
- dashboard
- platforms
- agents
- inbox/chats/messages
- Telegram webhook
- AI reply pipeline
- human takeover
- contacts
- legacy orders/complaints
- local files

## New Commerce Direction

```txt
select outlet
→ browse outlet products
→ cart
→ checkout
→ payment link
→ payment webhook
```

## Required Behavior

- workspace-scoped data
- outlet-aware operations
- outlet access permissions
- outlet-aware products/cart/order/payment


---

# FILE: 10-testing/e2e-test-plan.md

# E2E Test Plan

## Happy Path

```txt
Admin creates outlet
Admin creates product
Admin enables product for outlet
Customer starts Telegram
Customer selects outlet
Customer views product
Customer adds item to cart
Customer checks out
Payment link generated
Payment webhook marks paid
Admin filters Orders by outlet
Admin marks order processing/completed
```

## Multi-Outlet Case

Product available in Outlet A but not Outlet B.

Expected:

- not shown in Outlet B
- shown in Outlet A


---

# FILE: 10-testing/outlet-test-plan.md

# Outlet Test Plan

## Access Tests

- owner can view all outlets
- admin can view all outlets
- outlet manager sees assigned outlet only
- human agent sees assigned outlet chats only
- unauthorized outlet query returns 403/404

## Telegram Tests

- customer must choose outlet before product list
- inactive outlet not shown
- product list filtered by outlet availability
- switch outlet with active cart requires confirmation
- cart cannot mix outlets

## Cart/Checkout Tests

- cart has outlet_id
- checkout copies outlet_id
- order copies outlet_id
- payment copies outlet_id
- unavailable product cannot be added

## Payment Tests

- payment webhook updates correct outlet order
- duplicate webhook ignored
- amount mismatch rejected/logged


---

# FILE: 10-testing/security-test-plan.md

# Security Test Plan

## Workspace Isolation

- workspace A user cannot access workspace B orders/payments/outlets

## Outlet Isolation

- outlet A manager cannot list outlet B orders
- outlet A manager cannot view outlet B payment
- outlet A manager cannot update outlet B order
- outlet A manager cannot view outlet B chat

## AI Security

- AI cannot checkout without outlet
- AI cannot bypass product availability
- AI cannot mark payment paid


---

# FILE: 11-sprint/backlog.md

# Backlog

## Multi-Outlet Foundation

- Add outlets model/table.
- Add user outlet access.
- Add product outlet availability.
- Add outlet_id to cart/checkout/order/payment.
- Add current_outlet_id to chats.
- Add outlet API.
- Add outlet access API.
- Add outlet filter in orders/payments/chats/products.
- Add Telegram outlet selection.
- Add product filtering by outlet.
- Add cart outlet binding.
- Add checkout outlet validation.
- Add outlet access tests.
- Add Orders UI outlet filter/column/detail.

## Future Multi-Workspace

- Workspace switcher.
- Multi-workspace onboarding.
- Workspace billing.
- Franchise owner isolation.
- Workspace-specific payment/platform credentials.


---

# FILE: 11-sprint/implementation-status.md

# Implementation Status

## Decisions

| Item | Status |
|---|---|
| MVP single workspace | Decided |
| MVP multi outlet | Decided |
| Future multi workspace/franchise | Decided |
| Workspace != Outlet | Decided |
| Outlet required before Telegram commerce | Decided |

## Implementation

| Module | Status |
|---|---|
| Outlet schema | Not Started |
| Outlet access schema | Not Started |
| Product outlet availability | Not Started |
| Outlet filter APIs | Not Started |
| Telegram outlet selection | Not Started |
| Cart outlet binding | Not Started |
| Checkout outlet binding | Not Started |
| Orders outlet UI | Not Started |
| Outlet access tests | Not Started |


---

# FILE: 11-sprint/multi-outlet-foundation-sprint.md

# Sprint 1.5 — Multi-Outlet Foundation

## Goal

Add multi-outlet foundation while keeping MVP single-workspace and future multi-workspace ready.

## Deliverables

- outlets table/model
- user_outlet_access table/model
- product_outlet_availability table/model
- outlet_id added to cart/checkout/order/payment
- outlet filter support in APIs
- Telegram outlet selection flow
- Orders UI outlet filter/column/detail
- outlet access tests

## Tasks

### Data

- create outlets
- create user_outlet_access
- create product_outlet_availability
- add outlet_id to operational tables
- add indexes
- seed initial outlets

### Backend

- AccessControlService
- OutletService
- ProductAvailabilityService
- update CartService
- update CheckoutService
- update OrderService
- update PaymentService

### UI

- outlet filter
- Orders outlet column
- Order detail Outlet Info
- product outlet availability controls

### Testing

- cross-outlet access
- Telegram outlet selection
- cart/checkout outlet binding
- payment webhook outlet mapping


---

# FILE: 11-sprint/sprint-plan.md

# Sprint Plan

Updated sequence:

```txt
Sprint 0   — Stabilization
Sprint 1   — Service Boundaries + Webhook Idempotency
Sprint 1.5 — Multi-Outlet Foundation
Sprint 2   — Product Catalog + Outlet Availability
Sprint 3   — Cart + Telegram Commerce
Sprint 4   — Checkout + Payment Sandbox
Sprint 5   — Admin Operations
Sprint 6   — MVP Hardening
```

Multi-outlet must be added before product/cart/checkout are too deep.


---

# FILE: 12-ops/database-ops.md

# Database Ops

## Useful Queries

List outlets:

```sql
select * from outlets where workspace_id = '<workspace_id>';
```

Check user outlet access:

```sql
select * from user_outlet_access
where user_id = '<user_id>'
and workspace_id = '<workspace_id>';
```

Debug order outlet:

```sql
select id, order_number, workspace_id, outlet_id, status, payment_status
from orders
where order_number = '<order_number>';
```

## Rule

Do not manually move order outlet in production without audit/approval.


---

# FILE: 12-ops/troubleshooting.md

# Troubleshooting

## User Cannot See Orders

Check:

- workspace membership
- outlet access
- requested outlet_id
- order.outlet_id
- API access validation

## Product Not Showing in Telegram

Check:

- outlet selected
- outlet active
- product active
- product telegram_visible
- product_outlet_availability exists
- is_available = true

## Payment Updated Wrong Order

Check:

- provider reference mapping
- payment.order_id
- payment.outlet_id
- order.outlet_id
- webhook idempotency


---

# FILE: READING-ORDER.md

# Reading Order Prompt Before Coding

Use this as the required AI coding-agent prompt before any backend implementation.

```txt
You are working on SelaluTeh Chatbot CRM backend.

Latest architecture:
MVP = single workspace/account with multiple outlets.
Future production = multiple workspaces/accounts/franchise owners, each with multiple outlets.

Definitions:
- Workspace/account = business owner or franchise owner.
- Outlet = physical branch/cabang under a workspace.
- User can be member of a workspace.
- User can have access to selected outlets.

Rules:
1. Do not rebuild from scratch.
2. Do not break existing CRM behavior.
3. Do not hardcode single workspace.
4. All tenant-owned data must include workspace_id.
5. Outlet-operational data must include outlet_id.
6. Backend must validate workspace membership and outlet access.
7. Customer must select outlet before browsing products/cart/checkout.
8. Cart/checkout/order/payment must be bound to one outlet.
9. AI must respect outlet context.
10. AI cannot mark payment as paid or override payment/order state.
11. Payment webhook must be verified and idempotent.
12. Do not claim tests passed unless actually run.

Read these docs first:
1. docs/backend/index.md
2. docs/backend/brief/project-brief.md
3. docs/backend/brief/implementation-priority-brief.md
4. docs/backend/11-sprint/multi-outlet-foundation-sprint.md
5. docs/backend/09-ai-context/prompt-context.md
6. docs/backend/09-ai-context/outlet-context.md
7. docs/backend/04-tech-spec/architecture.md
8. docs/backend/06-data/database-schema.md
9. docs/backend/03-business-rules/outlet-rules.md
10. docs/backend/03-business-rules/outlet-access-rules.md
11. docs/backend/08-security/workspace-tenant-security.md
12. docs/backend/08-security/outlet-access-security.md

Then read task-specific docs:
- API: docs/backend/05-api-spec/*
- Data/schema: docs/backend/06-data/*
- Telegram commerce: docs/backend/02-flows/*
- UI/admin: docs/backend/07-uiux/*
- Security: docs/backend/08-security/*
- Testing: docs/backend/10-testing/*
- Sprint/status: docs/backend/11-sprint/*

Before coding, respond with:
1. Docs read
2. Current understanding
3. Exact task scope
4. Workspace/outlet impact
5. Files likely to change
6. Risks
7. Test plan
8. Do-not-break confirmation

After coding, respond with:
1. Summary
2. Files changed
3. Workspace/outlet behavior implemented
4. Tests run / not run
5. Remaining risks
6. Next recommended step
```


---

# FILE: brief/implementation-priority-brief.md

# Implementation Priority Brief

## Priority Order

1. Stabilize existing CRM.
2. Add service/repository boundaries.
3. Add webhook idempotency.
4. Add multi-outlet foundation.
5. Add product outlet availability.
6. Add Telegram outlet selection.
7. Add outlet-bound cart.
8. Add outlet-bound checkout/order.
9. Add payment sandbox/webhook.
10. Add admin Orders/Products/Payments outlet UI.
11. Add outlet access/security tests.

## Why Now

Cart, checkout, order, and payment must be outlet-bound. Adding outlet later will cause painful refactor.


---

# FILE: brief/project-brief.md

# Project Brief

SelaluTeh Chatbot CRM is becoming a Telegram-first marketplace MVP.

Latest architecture:

```txt
MVP = single workspace/account + multiple outlets
Future = multi workspace/account/franchise owner + multiple outlets each
```

Workspace is account/business/franchise owner.

Outlet is physical branch/cabang.

Customer orders through Telegram by selecting outlet first, browsing outlet products, adding to cart, checkout, payment link, payment webhook, then order processing.

Admin dashboard must support outlet filters and outlet-based permissions.


---

# FILE: brief/quick-prompt-for-ai-agent.md

# Quick Prompt for AI Agent

```txt
Latest decision:
MVP is single workspace/account with multiple outlets.
Future production is multi-workspace/multi-account/multi-franchise owner, where each workspace has multiple outlets.

Workspace = account/business/franchise owner.
Outlet = branch/cabang under workspace.

Do not rebuild from scratch.
Do not break existing CRM.
Do not hardcode single workspace.
All tenant data must be workspace-scoped.
Cart/checkout/order/payment must be outlet-bound.
Customer must select outlet before Telegram commerce.
Admin dashboard must filter by outlet.
Backend must validate outlet access server-side.
AI must respect outlet context and cannot mark payment paid.

Before coding, read docs/backend/READING-ORDER.md.
```


---

# FILE: index.md

# Backend Documentation Index

Project: **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**

Architecture mode:

```txt
MVP single workspace + multi outlet; future multi workspace/account/franchise owner + multi outlet
```

## Final Architecture Decision

### MVP Mode

```txt
Platform
  └── Workspace / Account: SelaluTeh
        ├── Outlet Samarinda
        ├── Outlet Tenggarong
        └── Outlet Bontang
```

### Future Production Mode

```txt
Platform
  ├── Workspace / Account / Franchise Owner A
  │     ├── Outlet A1
  │     └── Outlet A2
  ├── Workspace / Account / Franchise Owner B
  │     └── Outlet B1
  └── Workspace / Account / Franchise Owner C
        ├── Outlet C1
        └── Outlet C2
```

## Terminology

| Term | Meaning |
|---|---|
| Platform | The whole SaaS/application |
| Workspace / Account | Business account, merchant account, or franchise owner |
| Outlet | Physical branch/cabang under a workspace |
| Workspace Membership | User role inside a workspace |
| Outlet Access | User permission to operate one/many outlets |
| Product | Workspace-level product |
| Product Outlet Availability | Product availability/price/stock per outlet |
| Order | Transaction bound to one workspace and one outlet |
| Payment | Payment bound to order/workspace/outlet |

## Non-Negotiable Rules

1. Do not rebuild from scratch.
2. MVP may show only one workspace, but backend/database must be multi-workspace ready.
3. Workspace is not outlet.
4. All tenant-owned data must include `workspace_id`.
5. Outlet-operational data must include `outlet_id`.
6. Backend must validate workspace membership and outlet access server-side.
7. Customer must select outlet before product/cart/checkout.
8. Cart, checkout, order, and payment are bound to exactly one outlet.
9. AI must respect outlet context and cannot mark payment paid.
10. Payment webhook must be verified and idempotent.

## Updated Development Sequence

```txt
Sprint 0   — Stabilize existing CRM
Sprint 1   — Service boundaries + webhook idempotency
Sprint 1.5 — Multi-Outlet Foundation
Sprint 2   — Product catalog + outlet availability
Sprint 3   — Cart + Telegram outlet selection
Sprint 4   — Checkout + payment sandbox
Sprint 5   — Admin operations
Sprint 6   — MVP hardening
```
