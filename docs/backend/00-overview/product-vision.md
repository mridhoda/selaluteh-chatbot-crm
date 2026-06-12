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
