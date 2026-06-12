# Prompt Context

You are working on SelaluTeh Chatbot CRM backend.

## Latest Architecture

MVP:

```txt
single workspace/account
multiple outlets
```

Future production:

```txt
multiple workspaces/accounts/franchise owners
each workspace has multiple outlets
```

## Definitions

Workspace = account/business/franchise owner.

Outlet = physical branch/cabang.

## Preserve Existing System

- auth
- dashboard
- platforms
- agents
- inbox/chats/messages
- Telegram webhook
- AI reply pipeline
- human takeover
- contacts
- legacy orders/complaints
- local files

## New Commerce Direction

```txt
select outlet
→ browse outlet products
→ cart
→ checkout
→ payment link
→ payment webhook
```

## Required Behavior

- workspace-scoped data
- outlet-aware operations
- outlet access permissions
- outlet-aware products/cart/order/payment
