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
