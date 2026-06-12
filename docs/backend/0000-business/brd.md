# Business Requirements Document

## 1. Business Context

Many small businesses already use chat apps as their main sales and support channel. Customers often ask product questions through chat, but the actual purchase process still requires manual admin work:

- Admin answers product availability.
- Admin sends product price manually.
- Admin asks quantity manually.
- Admin sends payment instruction manually.
- Admin checks payment manually.
- Admin updates order manually.

This creates slow response time, missed orders, inconsistent data, and difficulty tracking conversion.

## 2. Business Problem

The business problem:

```txt
Chat has become the storefront, but most small businesses still manage chat commerce manually.
```

Current pain points:

- Conversations are not connected to structured orders.
- AI/chatbot can answer questions but does not complete transactions.
- Payment confirmation is manual or disconnected.
- Admin does not have a single operational view for chat, order, and payment.
- Business cannot measure product interest, checkout conversion, and abandoned carts.

## 3. Proposed Solution

Build a Telegram-first commerce MVP on top of the existing chatbot CRM.

The system should allow customers to:

```txt
open Telegram bot
→ browse products
→ add to cart
→ checkout
→ receive payment link
→ pay
→ receive confirmation
```

Admin should be able to:

```txt
manage products
→ view chats
→ handle human takeover
→ monitor orders
→ verify payment status
→ resolve complaints
```

## 4. MVP Objective

The MVP objective is to prove that a chat-first product flow can become a real transaction flow.

The MVP should prove:

- Telegram can be used as a storefront interface.
- Product/cart/checkout flow can be deterministic.
- Payment gateway sandbox can update order state automatically.
- Existing CRM inbox remains useful for support.
- AI can assist without controlling critical payment/order state.

## 5. In Scope

- Telegram-first single-merchant commerce.
- Product catalog.
- Cart and cart item.
- Checkout confirmation.
- Payment link via sandbox provider.
- Payment webhook.
- Admin product/order management.
- AI shopping assistant.
- Human takeover.
- Workspace-scoped CRM operations.

## 6. Out of Scope

- Multi-seller marketplace.
- Seller wallet.
- Seller payout.
- Commission engine.
- Logistics integration.
- Refund automation.
- Voucher/promo engine.
- Native mobile app.
- Public customer web storefront.
- Native WhatsApp payment.

## 7. Business Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR-001 | Customer can browse products from Telegram | P0 |
| BR-002 | Customer can add product to cart | P0 |
| BR-003 | Customer can checkout from Telegram | P0 |
| BR-004 | Customer can receive payment link | P0 |
| BR-005 | Payment webhook updates order status | P0 |
| BR-006 | Admin can manage products | P0 |
| BR-007 | Admin can view orders and payment status | P0 |
| BR-008 | Admin can take over chat from AI | P0 |
| BR-009 | AI can answer product questions | P1 |
| BR-010 | Admin can see basic conversion metrics | P1 |

## 8. Success Criteria

MVP is successful if:

```txt
At least one complete demo order can be created and paid through Telegram using sandbox payment.
```

Required demo outcome:

- Product listed in Telegram.
- Cart created.
- Checkout confirmed.
- Payment link generated.
- Payment webhook processed.
- Order marked paid.
- Admin sees the paid order.
