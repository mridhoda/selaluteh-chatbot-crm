# Design

## Design Goal

The admin dashboard should feel practical, calm, and operational.

This is a tool for managing:

- chats
- products
- orders
- payments
- platforms
- AI agents
- customer issues

## Design Principles

1. Clarity over decoration.
2. State visibility over aesthetics.
3. Safe actions over fast destructive actions.
4. Dense enough for admin operations.
5. Friendly enough for small business owners.
6. Consistent status language.
7. Mobile-aware, but desktop-first for admin.

## Admin Experience

Admin should always know:

- what needs attention
- which orders are unpaid
- which payments failed
- which chats are escalated
- which products are active
- which webhook events failed
- whether AI or human is replying

## Layout Pattern

Recommended:

```txt
Sidebar
Topbar
Page header
Filters/actions
Content table/card
Detail drawer or page
```

## Interaction Pattern

For state-changing action:

```txt
select entity
→ click action
→ validate/confirm if needed
→ backend request
→ show result
→ refresh/update state
```
