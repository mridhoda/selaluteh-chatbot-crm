# Webhook Test Plan

## Goal

Test all inbound webhook paths: Telegram, Meta, and payment provider.

## Telegram Webhook

### Happy Path

```txt
POST /webhook/telegram/:token
-> platform lookup
-> contact upsert
-> chat upsert
-> message insert
-> AI/human handling
-> sender call
```

Assertions:

- `webhook_events` row created.
- `messages.platform_message_id` stored.
- Duplicate payload ignored.

### Edge Cases

- Missing token.
- Invalid token.
- Unknown update type.
- Empty text but has attachment.
- Large attachment.
- Callback query without message.
- Same user on different workspace/platform.

## Meta Webhook

Test:

- Verification challenge.
- WhatsApp inbound message.
- Instagram inbound message.
- Unknown account id.
- Unsupported message type.

## Payment Webhook

Test:

- Valid signature.
- Invalid signature.
- Unknown provider transaction id.
- Duplicate event id.
- Status downgrade attempt.
- Paid event after expired order.
- Xendit valid `x-callback-token` accepted.
- Xendit invalid/missing `x-callback-token` rejected.
- Xendit completed event validates session ID, reference ID, amount, and currency.
- Xendit expired event does not downgrade paid payment.
- Xendit duplicate event does not duplicate Telegram notification.

Xendit Payment Session path:

```txt
POST /api/webhooks/xendit/payment-sessions
```

Accepted Xendit events:

```txt
payment_session.completed
payment_session.expired
```

## Required Idempotency Keys

| Webhook | Key |
|---|---|
| Telegram | update id + message id / callback id |
| Meta | entry/change/message id |
| Payment | provider event id or transaction id + status |
| Xendit Payment Session | webhook id if available, else payment_session_id + event type + updated timestamp |

## Acceptance

- Webhook endpoints return quickly.
- Duplicate events do not duplicate domain rows.
- Bad payloads are logged but do not crash server.
