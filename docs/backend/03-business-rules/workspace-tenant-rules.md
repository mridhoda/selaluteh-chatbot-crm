# Workspace and Tenant Rules

## Principle

`workspace_id` is the primary tenant boundary.

Every tenant-owned row must include `workspace_id`, and every route/repository must enforce it.

## Tenant-Owned Resources

The following resources must be workspace-scoped:

```txt
users
settings
platforms
agents
agent_* child rows
contacts
chats
messages
products
product_categories
product_variants
product_images
carts
cart_items
checkouts
orders
order_items
payments
payment_events
complaints
files
webhook_events
ai_actions
```

## Workspace Access Rules

### Owner

Owner can:

- manage workspace settings
- manage users
- manage platforms
- manage agents
- manage products
- view all chats
- take over chats
- manage orders and payments
- export workspace data

### Super

Super can do most operational actions except ownership-sensitive actions such as deleting workspace or changing owner identity.

### Agent

Agent can:

- view assigned/taken-over chats depending policy
- send human replies
- resolve assigned chats
- create internal notes if implemented

Agent cannot:

- manage billing/plan
- change payment credentials
- access another workspace
- see unassigned chats if role restriction is enabled
- change product price unless explicitly granted

## Workspace Creation

During registration:

```txt
Create workspace
-> create owner user
-> create default settings
-> optionally create default AI agent/platform placeholder
```

## Workspace Invariants

These must always be true:

```txt
chat.workspace_id = message.workspace_id
chat.workspace_id = contact.workspace_id
chat.workspace_id = platform.workspace_id
chat.workspace_id = agent.workspace_id
order.workspace_id = payment.workspace_id
order.workspace_id = order_item.workspace_id
cart.workspace_id = cart_item.workspace_id
```

If DB constraints cannot enforce every cross-table equality, repository/service layer must validate them.

## Cross-Workspace Access

Rejected behavior:

- user from workspace A reading chat in workspace B
- platform in workspace A creating contact in workspace B
- order in workspace A referencing product in workspace B
- payment event from one workspace updating order in another workspace

## Public Webhooks

Webhook endpoints are public externally, but writes must still resolve a trusted workspace through:

```txt
Telegram: platform token / webhook secret
Meta: account id / app secret / signature
Payment: provider signature / order/payment reference
```

After platform/payment lookup, all created rows must use the resolved `workspace_id`.

## Migration Rule

During Mongo to Postgres migration, every migrated row must receive a valid `workspace_id`. Records with missing or ambiguous workspace mapping must be written to failed-records output and not silently imported.
