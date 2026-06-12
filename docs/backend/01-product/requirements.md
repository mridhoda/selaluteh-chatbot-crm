# Product Requirements

## Outlet Requirements

Admin can:

- create outlet
- edit outlet
- activate/deactivate outlet
- set address/contact/opening hours
- assign staff to outlet
- view outlet-specific orders/payments/chats

## Commerce Requirements

Customer must:

- select outlet before commerce
- see only products available at selected outlet
- add items to outlet-bound cart
- checkout into outlet-bound order
- receive payment link
- receive payment/order notification

## Product Availability Requirements

Product is workspace-owned. Availability is outlet-specific.

Fields may include:

```txt
is_available
price_override
stock_quantity
status
```

## Permission Requirements

- Owner/admin sees all outlets in workspace.
- Outlet manager sees assigned outlets.
- Human agent handles assigned outlet chats/orders.
- Future franchise owner sees only their workspace.
