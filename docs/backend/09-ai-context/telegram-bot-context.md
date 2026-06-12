# Telegram Bot Context

Dokumen ini memberi context khusus untuk AI coding agent yang mengubah Telegram integration.

## Existing Telegram Architecture

Telegram saat ini memakai webhook:

```txt
POST /webhook/telegram/:token?
```

Flow existing:

```txt
Telegram update
-> find platform
-> find agent
-> upsert contact
-> upsert chat
-> save message
-> skip AI if takeover_by exists
-> generate AI reply
-> send Telegram reply
-> save AI message
```

## New Telegram Commerce Flow

Target flow:

```txt
/start
-> show main menu
-> browse products
-> view product detail
-> add to cart
-> view cart
-> checkout
-> send payment link
-> notify payment status
```

## Callback Data Convention

Use deterministic callback data:

```txt
menu:products
product:list:<page>
product:view:<product_id>
cart:add:<variant_id>
cart:view
cart:remove:<cart_item_id>
checkout:start
checkout:confirm:<checkout_id>
order:view:<order_id>
human:handoff
```

Rules:

- callback data must not contain secret.
- validate all ids server-side.
- callback id does not prove ownership.
- always scope by workspace + contact/chat.

## Telegram Message UX

Keep messages short. Use buttons for actions. Send long product descriptions as summary, not database dump.

## Idempotency

For every update:

- store provider event id/update id where possible,
- do not process same message twice,
- do not create duplicate cart/order from repeated callback.

## Human Takeover

If `chats.takeover_by` exists:

- save incoming user message,
- do not auto AI reply,
- optionally notify assigned human/admin.
