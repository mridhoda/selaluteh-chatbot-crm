# Entities

This document lists the MVP entities required by the current frontend surface: Dashboard, Inbox/Chats, Contacts, Platforms, Products, Outlets, Orders, Payments, Settings, AI Agents, and Complaints.

## Workspace

Business account or franchise owner. All tenant-owned records must belong to a workspace.

## Workspace Settings

Settings used by the Settings UI: business display name, timezone, currency, locale, support contact, default outlet, and whether admins can view all outlets.

## Outlet

Physical branch/cabang under workspace. Orders, carts, payments, product availability, and outlet-scoped dashboard metrics are bound to an outlet.

## User

Dashboard/admin actor. Users can own workspace roles, outlet access, and human takeover assignments.

## User Workspace Membership

Role of user inside workspace. Used for tenant-level authorization.

## User Outlet Access

Permission of user for one outlet. Used to restrict order/payment/product/outlet queries by `allowed_outlet_ids`.

## Platform

Connected channel account such as Telegram, WhatsApp, or Instagram. Required by Platforms UI and webhook routing.

## Contact

Customer or lead from a connected platform. Stores platform identity, profile data, tags, and optional last outlet context.

## Chat

Conversation thread with a contact. Stores current outlet context, AI enabled state, blocked/escalated state, human takeover owner, temporary checkout state in `state`, status, and assignment timestamps.

## Chat Message

Individual inbound/outbound message (`chat_messages` table). Used by Inbox, chat history, AI context, audit trail, and platform webhook payload storage.

## Agent

Workspace-scoped AI agent configuration for Telegram/WhatsApp/Instagram channels. Stores prompt, behavior, welcome message, tools, knowledge, follow-ups, legacy sales forms, complaint fields, complaint notification routing, and manual payment info as embedded JSON.

## Agent Outlet

Mapping between an AI agent and one or more real `outlets` rows. Replaces legacy `agent.outlets: [String]`.

## Complaint

Customer complaint tracked in Complaints UI. Links to outlet, contact, chat, and platform for traceability. Supports assignment to a dashboard user and priority/status workflow.

## File

Metadata for binaries stored on local server (`server/uploads`). Used by chat attachments, product images, agent database files, and manual payment proofs.

## Webhook Event

Idempotency and audit record for Telegram, Meta, and payment provider webhooks. Prevents duplicate message/order/payment side effects.

## AI Action

Audit record when AI proposes a commerce or escalation action. Final checkout/order/payment execution remains deterministic in backend services.

## Checkout

Optional intermediate entity for multi-step Telegram checkout confirmation before an order is created from a cart.

## Product Category

Workspace-owned product grouping used by product list/filter and Telegram product browsing.

## Product

Workspace-owned product. Includes SKU, pricing, cost, image, tax, tags, visibility, and stock tracking fields needed by Products UI.

## Product Variant

Product option such as size, flavor, package, or add-on. Cart/order items may reference a variant when selected.

## Product Outlet Availability

Availability, optional outlet price override, optional variant availability, and optional outlet stock.

## Cart

Customer cart bound to workspace, outlet, contact, and platform. One active cart is recommended per workspace + outlet + contact + platform.

## Cart Item

Line item in a cart. Stores product/variant reference plus price and name snapshots for deterministic checkout.

## Order

Transaction bound to workspace and outlet. Stores contact/platform/chat/cart references, order status, payment status, fulfillment status, customer snapshots, channel snapshot, totals, notes, and legacy `form_data`.

## Order Item

Line item in an order. Stores product/variant references as nullable plus product, variant, price, quantity, and subtotal snapshots.

## Order Event

Timeline event for Order Detail UI. Examples: created, paid, preparing, ready, completed, cancelled, note added.

## Payment Provider Settings

Workspace payment configuration used by Settings UI. Stores provider, environment, merchant ID, public key, encrypted server key, encrypted webhook secret, enabled methods, and status.

In the Xendit Test Mode MVP, sensitive provider settings are server environment variables, not frontend-editable values. UI can display `Xendit / Test Mode / configured` only.

## Payment

Payment bound to order, workspace, outlet, and contact. Stores provider data, payment link, provider reference, merchant reference, reconciliation status, fees, net amount, expiry, paid time, and matched time.

For Xendit Payment Session, the main payment row is the payment attempt record. `provider_transaction_id` stores `payment_session_id`, `merchant_reference` stores Xendit `reference_id`, and `payment_url` stores the hosted checkout URL.

## Payment Attempt

Retry/attempt record for a payment. Supports multiple payment links or retries while keeping the main payment row stable.

## Payment Event

Provider webhook or internal payment timeline event. Used for auditability and Payments detail timeline.

Xendit Payment Session events must be idempotent and may not downgrade paid payments. Event payloads are safe/redacted provider data only.
