# AI Pipeline Rules

Dokumen ini menjelaskan aturan pipeline AI backend.

## Current AI Pipeline

Current behavior:

```txt
incoming message
-> save user message
-> check human takeover
-> build prompt/context
-> call AI provider
-> parse markers
-> send reply
-> save AI message
```

## Target AI Pipeline

Target commerce-ready pipeline:

```txt
incoming message
-> normalize platform event
-> save message
-> load chat/session/cart context
-> detect if takeover exists
-> if takeover: stop AI
-> call AI assistant for intent/reply
-> validate action proposal
-> execute allowed backend action
-> send reply/keyboard
-> save result
```

## Provider Rules

- OpenAI/Gemini provider calls must be isolated in AI client/service.
- Provider errors should not crash webhook route.
- Fallback reply is allowed, but must be clearly safe and not invent order/payment state.

## Context Rules

AI prompt may include:

- current workspace/agent info,
- recent chat messages,
- relevant product summaries,
- current cart summary,
- FAQ/knowledge snippets,
- known policies.

AI prompt must not include:

- service role key,
- payment gateway secret,
- full customer database,
- unrelated workspace data,
- hidden admin-only notes unless required.

## Marketplace Rules

AI can propose:

```txt
search_products
show_product_detail
add_to_cart_request
checkout_request
check_order_status
handoff_to_human
```

AI cannot directly:

```txt
mark_payment_paid
change_product_price
override_stock
cancel_paid_order
refund_payment
read another user's order
```

## Marker Transition

Legacy markers like `FILE_ORDER_JSON` may remain temporarily for existing sales form behavior. New marketplace flow should prefer structured action proposals validated by backend service.
