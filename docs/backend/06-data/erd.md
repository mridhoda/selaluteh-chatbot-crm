# ERD

```txt
USERS
  │
  ├── USER_WORKSPACE_MEMBERSHIPS ── WORKSPACES ── OUTLETS
  │                                  │              │
  └── USER_OUTLET_ACCESS ────────────┘              │
                                                     │
WORKSPACES ── PRODUCTS ── PRODUCT_OUTLET_AVAILABILITY ── OUTLETS
                                                     │
CONTACTS ── CHATS ── CARTS ── CHECKOUTS ── ORDERS ── PAYMENTS
```

Key rule:

```txt
workspace_id = tenant boundary
outlet_id = operational branch boundary
```
