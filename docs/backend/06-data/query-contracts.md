# Query Contracts

## Required Query Context

All tenant queries require:

```txt
workspace_id
```

Outlet-specific queries require:

```txt
outlet_id or allowed_outlet_ids
```

## Orders Query

```txt
findOrders({
  workspaceId,
  allowedOutletIds,
  requestedOutletId,
  filters
})
```

## Products Query

Customer-facing:

```txt
findProductsForOutlet({
  workspaceId,
  outletId,
  activeOnly: true,
  telegramVisible: true
})
```

## Payments Query

```txt
findPayments({
  workspaceId,
  allowedOutletIds,
  requestedOutletId
})
```

If requestedOutletId is not allowed, return 403.
