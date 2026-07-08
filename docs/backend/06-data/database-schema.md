# Database Schema

## Architecture Mode

```txt
MVP: one workspace, many outlets
Future: many workspaces/accounts/franchise owners, each with many outlets
```

This schema is aligned to the current MVP frontend surface:

```txt
Dashboard, Inbox/Chats, Contacts, Platforms, Products, Outlets, Orders, Payments, Settings
```

The MVP target is still **Telegram-first commerce**, but the schema keeps the CRM/channel foundation compatible with WhatsApp and Instagram pages already present in the admin UI.

## Global Rules

```txt
workspace_id = tenant boundary
outlet_id = operational branch boundary
```

Rules:

1. All tenant-owned data must include `workspace_id`.
2. Outlet-operational commerce data must include `outlet_id`.
3. Snapshot fields are required on transactional rows so historical orders/payments remain stable even if product/customer data changes.
4. AI must not be the source of truth for product price, cart total, order status, or payment status.
5. Xendit provider IDs and merchant references are reconciliation keys, not authorization sources.

## Phase 3 Online QR Store Additions

Migration `038_online_qr_store_schema_phase3.sql` adds an additive schema layer for public Online Store, QR Store, and configurable payment providers without replacing existing commerce tables.

Migrations `039_online_qr_store_phase31_hardening.sql` and `040_online_qr_store_phase32_detail_schema.sql` continue that additive approach. They reconcile Phase 3.1/3.2 detail-schema fields into existing runtime tables instead of creating greenfield duplicates.

Migration `041_online_qr_store_phase33_integrity.sql` adds Phase 3.3 index and integrity hardening on the same runtime tables. Check constraints are added as `NOT VALID` so new writes are guarded while existing legacy rows can be cleaned up separately if needed. Follow-up hardening keeps payment provider settings unique per workspace/provider/mode, permits exactly one active provider per workspace/mode, indexes runtime `payment_events` for webhook idempotency, and includes `manual_review` as a payment-integrity state.

Target alpha reality on 2026-07-07: the live Supabase target had schema drift and did not track local `038` through `041` by local migration name, so they were not blindly replayed. Target-aware migration `042_online_qr_store_target_reconciliation.sql` was applied through Supabase MCP and verified. Migration `043`/`universal_qr_scope` was verified present in the target ledger/schema. Migration `044_public_checkout_idempotency_state.sql` was applied through Supabase MCP and verified. See `specs/backlog/qr-store-backend/database-readiness.md` for redacted target evidence.

Runtime mapping:

| Domain concept | Physical table |
|---|---|
| Storefront | `storefronts` |
| Storefront outlet mapping | `storefront_outlets` |
| QR location | `qr_locations` |
| QR code | `qr_codes` |
| QR session | existing `qr_order_sessions`, extended with QR code/location references and Universal QR selected/locked outlet context |
| Product availability | existing `product_outlet_availability` |
| Checkout idempotency | existing `order_idempotency_records` |
| Payment provider settings | `payment_provider_settings`, with existing encrypted workspace metadata as runtime credential fallback |
| Phase 3.2 checkout sessions | existing `checkouts` and service checkout snapshot flow |
| Phase 3.2 idempotency keys | existing `order_idempotency_records` |
| Phase 3.2 admin roles/permissions | existing `users`, `memberships`, `user_outlet_access`, and permission middleware |
| Phase 3.2 security events | optional `security_events` table from migration `040` |

Compatibility rules:

1. Existing public storefront metadata slug fallback remains valid until `storefronts` rows are seeded.
2. Existing `qr_order_sessions` hashed-token lookup remains valid until `qr_codes` rows are seeded.
3. Runtime fulfillment remains pickup-only even though schema can model future `dine_in` and `takeaway` values.
4. Payment providers remain data/config driven; BayarGG is seeded as an enabled provider but not hardcoded as the only provider. BayarGG live credential/readiness is deferred because no real SELKOP provider settings/credential row exists.
5. Phase 3.2 money-standard conversion to integer minor units is deferred because current runtime amount columns come from existing migrations and require coordinated data/API migration.
6. Paid-only fulfillment, provider-paid authority, backend total recomputation, QR outlet lock, cancel reason enforcement, customer-safe public responses, and public checkout customer identity requirements remain service-layer rules even when database constraints/indexes assist integrity.
7. BayarGG amount/currency/expiry mismatch paths move payments into `manual_review` and do not mark orders as paid.

---

## Core Tenant & Access Tables

### users

Represents dashboard/admin users.

Suggested fields:

```txt
id
name
email
password_hash
status
created_at
updated_at
```

### workspaces

Represents business account/franchise owner.

Suggested fields:

```txt
id
name
status
created_at
updated_at
```

### workspace_settings

Stores MVP settings used by Settings UI.

Suggested fields:

```txt
id
workspace_id
business_display_name
timezone
currency
locale
support_contact_email
default_outlet_id nullable
allow_all_outlets_view
metadata
created_at
updated_at
```

### outlets

Represents physical branch under workspace.

Suggested fields:

```txt
id
workspace_id
name
code
city
region
address
postal_code
phone
manager_user_id nullable
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

---

## Channel & CRM Tables

### platforms

Represents connected Telegram/WhatsApp/Instagram channels shown in Platforms UI.

Suggested fields:

```txt
id
workspace_id
type                    # telegram | whatsapp | instagram
label
status                  # connected | disconnected | error | disabled
account_id nullable
bot_id nullable
phone_number_id nullable
page_id nullable
token_encrypted nullable
credentials_encrypted nullable
webhook_configured
webhook_secret_encrypted nullable
agent_id nullable
metadata
created_at
updated_at
```

### contacts

Represents customers/leads from connected platforms.

Suggested fields:

```txt
id
workspace_id
platform_id nullable
external_id
name
phone nullable
email nullable
handle nullable
tags
last_outlet_id nullable
metadata
created_at
updated_at
```

### chats

Represents conversation thread, human takeover state, and temporary commerce state.

Suggested fields:

```txt
id
workspace_id
platform_id
contact_id
current_outlet_id nullable
status                  # open | pending | resolved | archived
ai_enabled
is_blocked
is_escalated            # true when customer asks for human admin
taken_over_by_user_id nullable
assigned_at nullable
resolved_at nullable
last_message_at nullable
state                   # JSON — temporary checkout/input state, e.g. {"awaiting":"delivery_address"}
metadata
created_at
updated_at
```

Notes:

```txt
Cart items must NOT live in chats.state.
Use chats.state only for short-lived input collection during checkout or legacy AI flows.
```

### chat_messages

Represents message history for Inbox and AI context.

Suggested fields:

```txt
id
workspace_id
chat_id
platform_id
contact_id
sender_type             # customer | ai | admin | system
user_id nullable
direction               # inbound | outbound
message_type            # text | image | file | audio | system
content nullable
raw_payload
created_at
```

---

## Product & Inventory Tables

### product_categories

Suggested fields:

```txt
id
workspace_id
name
slug
status
sort_order
created_at
updated_at
```

### products

Workspace-owned product. Field set is aligned to Products UI but keeps sales metrics derived from orders instead of duplicated.

Suggested fields:

```txt
id
workspace_id
category_id nullable
name
slug
sku nullable
short_description nullable
description nullable
base_price
cost_price nullable
currency
thumbnail_file_id nullable
thumbnail_url nullable
tags
tax_rate nullable
tax_label nullable
is_featured
is_active
stock_tracking
stock_quantity nullable
metadata
created_at
updated_at
```

### product_variants

Use variants for size, flavor, package, or add-ons.

Suggested fields:

```txt
id
workspace_id
product_id
name
sku nullable
price_delta
final_price nullable
is_active
sort_order
metadata
created_at
updated_at
```

### product_outlet_availability

Represents product availability, price override, and optional stock per outlet.

Suggested fields:

```txt
id
workspace_id
product_id
variant_id nullable
outlet_id
is_available
price_override nullable
stock_quantity nullable
status
created_at
updated_at
```

---

## Cart, Order & Payment Tables

### carts

Customer cart bound to workspace/outlet/contact/platform.

Suggested fields:

```txt
id
workspace_id
outlet_id
contact_id
platform_id
status                  # active | ordered | abandoned | cleared
subtotal_amount
discount_amount
delivery_fee
total_amount
currency
metadata
expires_at nullable
created_at
updated_at
```

### cart_items

Suggested fields:

```txt
id
workspace_id
cart_id
product_id
variant_id nullable
product_name_snapshot
variant_name_snapshot nullable
base_price nullable
effective_price nullable
unit_price
quantity
subtotal_amount
modifiers
notes nullable
metadata
created_at
updated_at
```

### orders

Transaction bound to workspace/outlet. Order stores customer, channel, pricing, fulfillment, payment status, and legacy `form_data` snapshot.

Suggested fields:

```txt
id
workspace_id
outlet_id
contact_id
platform_id
chat_id nullable
agent_id nullable
cart_id nullable
order_number
status                  # new | accepted | preparing | ready | completed | cancelled
payment_status          # unpaid | pending | paid | failed | expired | refunded
fulfillment_status      # unfulfilled | preparing | ready | fulfilled | cancelled
customer_name_snapshot
customer_phone_snapshot nullable
channel_snapshot
customer_snapshot
fulfillment_snapshot
subtotal_amount
discount_amount
delivery_fee
total_amount
currency
payment_method nullable
notes nullable
form_data
metadata
created_at
updated_at
```

Important:

```txt
orders.status != orders.payment_status
```

### order_items

Suggested fields:

```txt
id
workspace_id
order_id
product_id nullable
variant_id nullable
product_name_snapshot
variant_name_snapshot nullable
unit_price
quantity
subtotal_amount
modifiers
notes nullable
metadata
created_at
updated_at
```

### order_events

Timeline events shown by Order Detail UI.

Suggested fields:

```txt
id
workspace_id
order_id
event_type              # created | paid | preparing | ready | completed | cancelled | note_added
label
actor_type              # system | admin | customer | webhook
actor_user_id nullable
metadata
created_at
```

### payment_provider_settings

Stores payment provider settings shown in Settings UI.

For the current Xendit Test Mode MVP, sensitive provider values are server environment variables, not frontend-editable records:

```txt
XENDIT_SECRET_API_KEY
XENDIT_WEBHOOK_VERIFICATION_TOKEN
```

The UI may receive only safe state such as provider, environment, and configured boolean.

Suggested fields:

```txt
id
workspace_id
provider                # midtrans | xendit | manual
environment             # sandbox | production
merchant_id nullable
public_key nullable
server_key_encrypted nullable
webhook_secret_encrypted nullable
enabled_methods
status
created_at
updated_at
```

### payments

Payment bound to order/workspace/outlet and aligned to Payments UI.

Suggested fields:

```txt
id
workspace_id
outlet_id
order_id
contact_id
provider
method nullable
payment_method nullable
status                  # pending | paid | failed | expired | cancelled | refunded
reconciliation_status   # pending | matched | missing_webhook | unmatched | amount_mismatch | duplicate | provider_paid_order_pending
attempt_number
amount
gross_amount
provider_fee nullable
net_amount nullable
currency
payment_link nullable
payment_url nullable
provider_ref nullable
provider_transaction_id nullable
merchant_reference nullable
customer_snapshot
expires_at nullable
paid_at nullable
matched_at nullable
metadata
created_at
updated_at
```

For Xendit Payment Session:

```txt
provider = xendit
provider_transaction_id = Xendit payment_session_id
merchant_reference = Xendit reference_id
payment_url/payment_link = Xendit payment_link_url
expires_at = session expiry
metadata.provider_payment_request_id = Xendit payment_request_id when supplied
metadata.provider_payment_id = Xendit payment_id when supplied
metadata.environment = test
metadata.idempotency_key = application create-session idempotency key
```

Payment and order statuses remain separate. Payment webhook updates `orders.payment_status`, not fulfillment lifecycle completion.

### payment_attempts

Represents retry/attempt history for one payment.

Suggested fields:

```txt
id
workspace_id
payment_id
attempt_number
status
method nullable
payment_method nullable
provider_ref nullable
provider_transaction_id nullable
payment_link nullable
payment_url nullable
gross_amount nullable
customer_snapshot
created_at
expired_at nullable
paid_at nullable
```

### payment_events

Provider webhook and internal timeline events.

Suggested fields:

```txt
id
workspace_id
payment_id
order_id nullable
provider nullable
provider_event_id nullable
event_type nullable
status nullable
processing_status       # received | verified | processed | rejected | failed
verification_result nullable
amount nullable
currency nullable
fee_amount nullable
net_amount nullable
payment_method nullable
raw_payload
received_at
created_at
updated_at
```

Current Supabase runtime stores canonical payment timeline rows in `payment_events` for `GET /payments/:paymentId/events`.

For Xendit Payment Session events, store normalized event type (`payment_session.completed` or `payment_session.expired`), provider event key, provider status, amount, currency, processing status, and safe provider payload. Do not store API keys, callback token headers, or Authorization headers.

---

## MVP Tables Summary

```txt
Core Tenant & Access:
  users
  workspaces
  workspace_settings
  outlets
  user_workspace_memberships
  user_outlet_access

Channel & CRM:
  platforms
  contacts
  chats
  chat_messages

Product & Inventory:
  product_categories
  products
  product_variants
  product_outlet_availability

Cart, Order & Payment:
  carts
  cart_items
  orders
  order_items
  order_events
  payment_provider_settings
  payments
  payment_attempts
  payment_events

AI Agent & Complaints:
  agents
  agent_outlets
  complaints
```

Total core MVP tables: 26.

## Operational & Infrastructure Tables

These tables are required for Telegram webhook idempotency, media metadata, optional multi-step checkout, and AI commerce audit. They are part of the canonical MVP runtime schema even though they are not admin CRUD pages.

### files

Local/server file metadata. Binary content stays in `server/uploads`.

Suggested fields:

```txt
id
workspace_id
storage_provider
disk
relative_path
public_path nullable
original_name nullable
stored_name
mime_type nullable
size_bytes nullable
source                  # platform_inbound | product_image | agent_database | payment_proof | ...
created_by nullable
metadata
created_at
```

### webhook_events

Idempotency and audit for Telegram/Meta/payment webhooks.

Suggested fields:

```txt
id
workspace_id nullable
platform_id nullable
provider
event_type
external_event_id
status                  # received | processing | processed | ignored_duplicate | failed
payload
error nullable
received_at
processed_at nullable
created_at
```

### ai_actions

Audit trail when AI proposes commerce actions. Backend executes checkout/order/payment deterministically.

Suggested fields:

```txt
id
workspace_id
chat_id nullable
chat_message_id nullable
agent_id nullable
action_type
status                  # proposed | validated | executed | rejected | cancelled | failed
input
output
validation_errors
error nullable
confirmed_at nullable
executed_at nullable
created_at
updated_at
```

Current Mongo implementation note:

```txt
AIAction stores workspaceId, chatId, chatMessageId, agentId, actionType,
status, input, output, validationErrors, error, confirmedAt, executedAt,
createdAt, and updatedAt.
```

### checkouts

Optional but recommended for multi-step checkout confirmation before order creation.

Suggested fields:

```txt
id
workspace_id
outlet_id
cart_id
chat_id nullable
contact_id
status                  # draft | awaiting_confirmation | confirmed | cancelled | expired
customer_name nullable
customer_phone nullable
customer_address nullable
delivery_method nullable
notes nullable
confirmed_at nullable
expires_at nullable
metadata
created_at
updated_at
```

Notes:

```txt
If checkout is skipped, cart -> order conversion can happen directly in one transaction.
Keep checkouts when Telegram flow needs address/confirmation steps.
```

## AI Agent & Complaint Tables

### agents

Stores AI agent configuration used by Agents UI. Agent settings are workspace-scoped and may include sales scenarios, knowledge sources, and complaint routing.

Suggested fields:

```txt
id
workspace_id
platform_id nullable
name
behavior
prompt
welcome_message nullable
sticker_url nullable
tools                              # JSON array of tool configs
knowledge                          # JSON array of {kind, value, originalName?}
follow_ups                         # JSON array of {prompt, delay}
database                           # JSON array of uploaded file references
complaint_fields                   # JSON array of complaint form field definitions
complaint_notification             # JSON object {enabled, platform_id, destination}
sales_forms                        # JSON array of sales scenario configs
payment                            # JSON object {enabled, bank_info, qris_url}
status                             # active | inactive
created_at
updated_at
```

Notes:

```txt
sales_forms items shape: {name, trigger_keywords, fields, products, is_active}
products items shape: {name, price, description}
payment shape: {enabled: boolean, bank_info: text, qris_url: text}
knowledge items shape: {kind: "url"|"file", value: text, original_name: text optional}
```

Migration note:

```txt
Legacy agent sales_forms.products overlap with the new product catalog.
During MVP, keep both patterns. Future: deprecate agent-embedded products
in favor of the workspace product catalog.
```

### agent_outlets

Maps an AI agent to one or more outlets. Replaces the legacy `agent.outlets: [String]` pattern.

Suggested fields:

```txt
id
workspace_id
agent_id
outlet_id
created_at
```

### complaints

Stores customer complaints tracked in the Complaints UI. Complaints may originate from chats or manual admin entry.

Suggested fields:

```txt
id
workspace_id
outlet_id nullable
contact_id nullable
chat_id nullable
platform_id nullable
channel                             # telegram | whatsapp | instagram | internal
subject
description nullable
status                              # open | resolved | dismissed
priority                            # low | medium | high | urgent
assigned_to_user_id nullable
resolution_notes nullable
form_data                           # JSON — legacy AI complaint payload compatibility
metadata
created_at
updated_at
```

---

## Status Reference

Use these values consistently across schema docs, migration SQL, payment gateway mapping, and admin UI.

### Order lifecycle

```txt
orders.status:
  new | accepted | preparing | ready | completed | cancelled

orders.payment_status:
  unpaid | pending | paid | failed | expired | refunded

orders.fulfillment_status:
  unfulfilled | preparing | ready | fulfilled | cancelled
```

Payment webhook success example:

```txt
orders.payment_status = paid
orders.status = accepted             # or preparing when kitchen starts immediately
orders.fulfillment_status = unfulfilled
```

### Payment lifecycle

```txt
payments.status:
  pending | paid | failed | expired | cancelled | refunded

payments.reconciliation_status:
  pending | matched | missing_webhook | unmatched | amount_mismatch | duplicate | provider_paid_order_pending
```

Provider raw statuses stay in `payment_events.raw_payload`.

---

## SQL Naming Notes

Canonical docs and migration SQL use the same names:

```txt
workspace_settings   (not settings)
chat_messages        (not messages)
taken_over_by_user_id (legacy Mongo field: takeover_by)
external_id on contacts (legacy Mongo field: platform_account_id)
token_encrypted on platforms (legacy Mongo field: token)
```

---

## Add outlet_id To Legacy/Operational Tables

```txt
carts
orders
payments
complaints
```

Optional but recommended:

```txt
chats.current_outlet_id
contacts.last_outlet_id
```
