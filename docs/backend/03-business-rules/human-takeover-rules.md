# Human Takeover Rules

## Purpose

Defines behavior when human admin/agent takes over a conversation.

## Takeover State

Human takeover is represented by:

```txt
chats.takeover_by is not null
```

When takeover exists, AI must stop auto-replying to new customer messages.

## Who Can Take Over

Allowed roles:

```txt
owner
super
agent
```

All must belong to same workspace as chat.

## Takeover Effects

When chat is taken over:

```txt
chats.takeover_by = current_user.id
chats.is_escalated = false
chats.status = open
```

AI response pipeline must skip automatic reply.

## Release Takeover

If release feature is implemented:

```txt
chats.takeover_by = null
```

Then AI may resume depending agent/platform settings.

Recommended MVP: manual release only by owner/super or assigned agent.

## Send Human Reply

Human reply must:

- validate workspace
- validate chat access
- insert message `sender=human`
- send through correct provider
- store `platform_message_id` if provider returns it
- update `chat.last_message_at`

## Customer Message During Takeover

Incoming platform webhook should:

1. save customer message
2. update unread
3. detect `takeover_by`
4. skip AI
5. optionally notify assigned human/admin

## Transfer Rule

If chat assigned to one human and another takes over:

- owner/super may override
- agent may not override another agent unless allowed
- transfer should be auditable

## Resolve Rule

Resolving a chat means operationally finished.

On resolve:

```txt
chats.status = resolved
chats.unread = 0
```

Recommended:

- keep `takeover_by` for history or clear it depending UI expectation.
- for marketplace order still active, resolving chat should not cancel order.

## Marketplace Conflict

Human takeover does not invalidate cart/order/payment state.

Human can guide user, but backend rules still control checkout/payment/order status.
