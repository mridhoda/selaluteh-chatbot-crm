# Outlet Access Security

## Threat

A user changes URL/query:

```txt
/orders?outlet_id=other_outlet
```

## Required Validation

For every outlet-scoped request:

1. user authenticated
2. user belongs to workspace
3. outlet belongs to workspace
4. user has outlet access or all-outlet role
5. action is allowed

## Applies To

- orders
- payments
- carts
- checkouts
- chats
- complaints
- analytics
- product availability

## Error

Unauthorized outlet access:

```txt
403 Forbidden
```
