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
