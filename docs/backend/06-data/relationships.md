# Relationships

## Tenant & Access

```txt
workspaces 1 ── * workspace_settings
workspaces 1 ── * outlets
workspaces 1 ── * user_workspace_memberships
users      1 ── * user_workspace_memberships

workspaces 1 ── * user_outlet_access
outlets    1 ── * user_outlet_access
users      1 ── * user_outlet_access

users      1 ── * outlets.manager_user_id
```

## Channel & CRM

```txt
workspaces 1 ── * platforms
workspaces 1 ── * contacts
workspaces 1 ── * chats
workspaces 1 ── * chat_messages

platforms  1 ── * contacts
platforms  1 ── * chats
platforms  1 ── * chat_messages

contacts   1 ── * chats
contacts   1 ── * chat_messages
contacts   1 ── * carts
contacts   1 ── * orders
contacts   1 ── * payments
contacts   1 ── * complaints

chats      1 ── * chat_messages
chats      1 ── * orders
chats      1 ── * complaints

outlets    1 ── * chats.current_outlet_id
outlets    1 ── * contacts.last_outlet_id
users      1 ── * chats.taken_over_by_user_id
```

## Products & Availability

```txt
workspaces         1 ── * product_categories
workspaces         1 ── * products
workspaces         1 ── * product_variants
workspaces         1 ── * product_outlet_availability

product_categories 1 ── * products
products           1 ── * product_variants
products           1 ── * product_outlet_availability
product_variants   1 ── * product_outlet_availability
outlets            1 ── * product_outlet_availability
```

## Commerce Chain

```txt
workspaces 1 ── * carts
outlets    1 ── * carts
platforms  1 ── * carts
contacts   1 ── * carts
carts      1 ── * cart_items

products         1 ── * cart_items
product_variants 1 ── * cart_items

carts      1 ── * orders
workspaces 1 ── * orders
outlets    1 ── * orders
platforms  1 ── * orders
contacts   1 ── * orders
chats      1 ── * orders

orders     1 ── * order_items
orders     1 ── * order_events
products         1 ── * order_items
product_variants 1 ── * order_items

orders     1 ── * payments
payments   1 ── * payment_attempts
payments   1 ── * payment_events
```

Current Xendit Test Mode implementation uses the main `payments` row as the active session attempt and stores provider session details there. `payment_attempts` remains available for future richer attempt history.

## AI Agent & Complaints

```txt
workspaces 1 ── * agents
platforms  1 ── * agents.platform_id

agents     1 ── * agent_outlets
outlets    1 ── * agent_outlets
workspaces 1 ── * agent_outlets

workspaces 1 ── * complaints
outlets    1 ── * complaints.outlet_id
contacts   1 ── * complaints.contact_id
chats      1 ── * complaints.chat_id
platforms  1 ── * complaints.platform_id
users      1 ── * complaints.assigned_to_user_id
```

Note:

```txt
agents store knowledge, follow_ups, sales_forms, tools, database,
complaint_fields, complaint_notification, and payment as embedded JSON.
This avoids excessive joins for MVP. Future: normalize into separate tables
if query/update patterns require it.
```

---

Recommended MVP chain:

```txt
workspace → outlet → platform → contact → chat → cart → order → payment
```

Notes:

1. `checkouts` is optional for multi-step Telegram checkout. Direct cart -> order conversion is also valid.
2. Dashboard metrics should be derived from `orders`, `order_items`, `payments`, and `product_outlet_availability` first.
3. Snapshot fields in `cart_items`, `order_items`, `orders`, and `payments` protect historical records from future product/contact changes.
4. Agent knowledge, follow-ups, sales forms, and tools are stored as embedded JSON in `agents` for MVP simplicity. Normalize later if needed.
5. Complaints link to outlet, contact, chat, and platform for full traceability.
6. Runtime tables `files`, `webhook_events`, and `ai_actions` are required even though they are not admin CRUD pages.
7. Xendit webhooks resolve workspace/outlet/order through the matched payment row, not from untrusted webhook query/body fields.
