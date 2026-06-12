# Relationships

```txt
workspaces 1 ── * outlets
workspaces 1 ── * user_workspace_memberships
users 1 ── * user_workspace_memberships

outlets 1 ── * user_outlet_access
users 1 ── * user_outlet_access

workspaces 1 ── * products
products 1 ── * product_outlet_availability
outlets 1 ── * product_outlet_availability

outlets 1 ── * carts
outlets 1 ── * checkouts
outlets 1 ── * orders
outlets 1 ── * payments
```

Commerce chain:

```txt
workspace → outlet → cart → checkout → order → payment
```
