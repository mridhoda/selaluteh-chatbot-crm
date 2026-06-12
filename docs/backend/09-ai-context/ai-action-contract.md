# AI Action Contract

Dokumen ini mendefinisikan kontrak AI action agar side effect backend aman.

## Principle

AI hanya boleh **mengusulkan action**. Backend yang memvalidasi dan mengeksekusi.

```txt
AI proposal != final state change
```

## Allowed Actions for MVP

| Action | Backend Validation |
|---|---|
| `search_products` | workspace scope, active products only |
| `show_product_detail` | product belongs to workspace and active |
| `add_to_cart` | product/variant active, qty valid, stock rule valid |
| `remove_from_cart` | cart belongs to contact/session |
| `view_cart` | cart belongs to contact/session |
| `start_checkout` | cart not empty, contact valid |
| `check_order_status` | order belongs to contact/workspace |
| `handoff_to_human` | chat belongs to workspace |

## Forbidden Actions

AI must not execute or propose final state for:

- payment success,
- refund,
- stock override,
- price override,
- workspace switch,
- admin permission change,
- reading private data from another contact.

## Action Record

Every executed action should be logged to `ai_actions` or equivalent audit table:

```txt
workspace_id
chat_id
message_id
agent_id
action_type
input_json
result_json
status
created_at
```

## Confirmation Required

These actions require explicit user confirmation:

- checkout,
- create order,
- cancel order,
- handoff if it reveals wait time or admin availability.

## Error Handling

If validation fails:

- do not execute action,
- reply with safe clarification,
- log failed action,
- never expose stack trace to user.
