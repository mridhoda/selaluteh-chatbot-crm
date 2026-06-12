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
