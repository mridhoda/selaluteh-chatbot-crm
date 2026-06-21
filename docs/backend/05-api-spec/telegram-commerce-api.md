# Telegram Commerce API

## Purpose

Defines backend contract for Telegram inline button/callback marketplace flow.

This is not necessarily a public REST API for the dashboard. It describes internal actions triggered by Telegram callback queries.

## Callback Data Convention

Telegram callback data has length limits, so keep compact.

Recommended format:

```txt
act:<scope>:<action>:<optional_id>:v<version>
```

Examples:

```txt
act:outlet:select:<outlet_id>:v1
act:prod:list:v1
act:prod:list:<page>:v1
act:prod:detail:<product_id>:v1
act:add:1:<product_id>:v1
act:add:3:<product_id>:v1
act:cart:view:v1
act:cart:clear:v1
act:remove:<product_id>:v1
act:checkout:start:v1
act:checkout:confirm:<checkout_id>:v1
act:order:status:v1
```

The `v<version>` suffix enables stale callback protection. Older callbacks are rejected when the runtime commerce version is bumped.

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
| `confirm_checkout` | Create order, payment attempt, and payment instruction |
| `create_payment` | Create/reuse Xendit Test Mode payment link or manual/COD instruction |
| `check_order_status` | Show latest order status |
| `talk_to_human` | Escalate/takeover path |

## Telegram Message UI Rules

- Product list should be short and paginated.
- Product detail should include price, availability, and add-to-cart button.
- Cart summary must show total before checkout.
- Payment link or manual/COD instruction should be shown only after order is created.
- Xendit Test Mode payment link should be clearly presented as hosted checkout, without exposing credentials.
- Checkout confirmation must be explicit.
- Product list must be paginated.
- Order status action shows recent orders for the Telegram contact/chat.

## Idempotency

Callback query may be resent/retried. Backend must prevent duplicate:

- cart item increments from same callback event
- checkout confirmations
- payment creations

Current implementation also reuses existing pending/paid payment attempts for the same order.

For Xendit Payment Session, repeated `create_payment` must reuse active pending session or return the same result for the same idempotency key. It must not create another Xendit session just because Telegram resends a callback.

Use:

```txt
webhook_events.event_id
idempotency key per callback_query_id
```
