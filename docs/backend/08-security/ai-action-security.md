# AI Action Security

## Purpose

AI action security defines how AI can interact with marketplace and CRM actions safely.

## Allowed AI Actions

AI may propose:

```txt
search_product
show_product_detail
add_to_cart
remove_from_cart
view_cart
start_checkout
ask_clarifying_question
create_complaint_draft
escalate_to_human
summarize_chat
```

Legacy compatibility actions currently audited by backend:

```txt
create_legacy_order
create_legacy_complaint
```

These preserve the current CRM AI sales-form and complaint behavior while cart/checkout/order services are introduced. They must include `workspace_id` and are logged in `ai_actions` before execution.

## Restricted Actions

AI must not directly:

```txt
mark_payment_paid
refund_payment
change_product_price
change_inventory
create_final_order_without_confirmation
access_other_workspace_data
send_platform_token
approve_manual_payment
```

## Action Validation

Every AI action must be validated by backend:

```txt
workspace ownership
chat/contact/session ownership
product availability
cart state
required confirmation
role/permission if admin action
business rules
```

## AI Action Lifecycle

```txt
proposed
validated
executed
rejected
failed
```

Recommended table:

```txt
ai_actions
  id
  workspace_id
  chat_id
  action_type
  payload
  status
  validation_errors
  created_at
  executed_at
```

## Current Backend Enforcement

Implemented in Sprint 1:

- AI action validation lives in `server/src/services/ai-actions.service.js`.
- Audit rows are stored by `server/src/models/AIAction.js`.
- Persistence is isolated through `server/src/db/repositories/ai-actions.repository.js`.
- Restricted actions are rejected before execution.
- `workspace_id` is required before an AI action can be logged or executed.
- `add_to_cart` and `start_checkout` require outlet context in their payload.
- Legacy AI-created orders and complaints are logged as `create_legacy_order` and `create_legacy_complaint`.

Restricted payment/order state actions such as `mark_payment_paid`, `mark_order_paid`, `set_order_paid`, `override_payment_status`, and `approve_manual_payment` are blocked by backend validation.

## Checkout Confirmation

Before backend creates final order/payment, user must confirm:

```txt
items
quantity
total
pickup/delivery option if applicable
payment method
```

AI cannot infer confirmation from ambiguous text unless flow policy allows it.
