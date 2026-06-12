# AI Actions API

## Purpose

AI may propose commerce/CRM actions, but backend must validate and execute them.

This avoids unsafe behavior where AI directly creates paid orders or modifies state without deterministic checks.

## AI Action Lifecycle

```txt
proposed
validated
executed
rejected
failed
```

## POST `/api/v1/ai-actions/validate`

Validate an AI-proposed action without executing it.

Internal/admin only.

### Request

```json
{
  "chat_id": "019...",
  "contact_id": "019...",
  "agent_id": "019...",
  "action_type": "search_product",
  "payload": {
    "query": "salty caramel"
  }
}
```

### Response

```json
{
  "success": true,
  "data": {
    "valid": true,
    "normalized_action": {
      "action_type": "search_product",
      "payload": {
        "query": "salty caramel"
      }
    }
  }
}
```

## POST `/api/v1/ai-actions/execute`

Execute validated action.

### Request

```json
{
  "chat_id": "019...",
  "action_type": "add_to_cart",
  "payload": {
    "product_id": "019...",
    "variant_id": "019...",
    "quantity": 1
  },
  "requires_user_confirmation": true,
  "user_confirmed": true
}
```

### Response

```json
{
  "success": true,
  "data": {
    "ai_action_id": "019...",
    "status": "executed",
    "result": {
      "cart_id": "019...",
      "cart_item_id": "019..."
    }
  }
}
```

## Allowed AI Actions

| Action | Confirmation Required | Notes |
|---|---:|---|
| `search_product` | No | Read-only |
| `show_product_detail` | No | Read-only |
| `add_to_cart` | Usually yes | Can be direct from explicit user phrase |
| `view_cart` | No | Read-only |
| `start_checkout` | Yes | Must confirm cart |
| `check_order_status` | No | Must match current contact/workspace |
| `create_complaint_draft` | Yes | Before creating complaint |
| `handoff_to_human` | No | Safe escalation |

## Forbidden AI Actions

AI must not execute:

```txt
mark_payment_paid
change_order_total
change_product_price
bypass_checkout
refund_payment
read_other_workspace_data
delete_customer_data
```

## Storage

Each AI action should be stored in `ai_actions` with:

```txt
workspace_id
chat_id
agent_id
action_type
payload
status
validation_error
result
created_at
executed_at
```
