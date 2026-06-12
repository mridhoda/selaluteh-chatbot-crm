# Telegram Commerce API

## Purpose

Defines backend contract for Telegram inline button/callback marketplace flow.

This is not necessarily a public REST API for the dashboard. It describes internal actions triggered by Telegram callback queries.

## Callback Data Convention

Telegram callback data has length limits, so keep compact.

Recommended format:

```txt
act:<action>:<short_id>
```

Examples:

```txt
act:cat:list
act:prod:p_abc123
act:add:v_abc123
act:cart:view
act:cart:inc_i_abc123
act:cart:dec_i_abc123
act:checkout:start
act:checkout:confirm
act:order:o_abc123
```

Use short IDs mapped to UUID server-side if needed.

## Internal Action Endpoint

Optional internal route:

```http
POST /api/v1/telegram/actions
```

This endpoint should only be callable by trusted webhook handler, not public dashboard.

### Request

```json
{
  "platform_id": "019...",
  "chat_id": "019...",
  "contact_id": "019...",
  "telegram_chat_id": "1234567",
  "telegram_message_id": "100",
  "callback_query_id": "abc",
  "action": "add_to_cart",
  "payload": {
    "variant_id": "019...",
    "quantity": 1
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "reply_text": "Ditambahkan ke cart ✅",
    "edit_message": true,
    "keyboard": [
      [
        { "text": "Lihat Cart", "callback_data": "act:cart:view" }
      ]
    ]
  }
}
```

## Main Actions

| Action | Effect |
|---|---|
| `start_menu` | Show main menu |
| `list_categories` | Show category buttons |
| `list_products` | Show product list |
| `show_product` | Show product detail |
| `add_to_cart` | Add product variant to cart |
| `view_cart` | Show cart summary |
| `update_quantity` | Increment/decrement cart item |
| `start_checkout` | Ask customer info/confirm order |
| `confirm_checkout` | Create order pending payment |
| `create_payment` | Create payment link and send it |
| `check_order_status` | Show latest order status |
| `talk_to_human` | Escalate/takeover path |

## Telegram Message UI Rules

- Product list should be short and paginated.
- Product detail should include price, availability, and add-to-cart button.
- Cart summary must show total before checkout.
- Payment link should be shown only after order is created.
- Checkout confirmation must be explicit.

## Idempotency

Callback query may be resent/retried. Backend must prevent duplicate:

- cart item increments from same callback event
- checkout confirmations
- payment creations

Use:

```txt
webhook_events.event_id
idempotency key per callback_query_id
```
