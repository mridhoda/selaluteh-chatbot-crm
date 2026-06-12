# Integration Test Plan

## Goal

Integration tests verify API route + repository + database behavior using test database and mocked external providers.

## Required Setup

```txt
NODE_ENV=test
DATABASE_URL=<test postgres/supabase local or isolated project>
LOCAL_UPLOAD_ROOT=<temp dir>
TELEGRAM_BOT_TOKEN=<fake token>
PAYMENT_PROVIDER_MODE=sandbox
```

## Test Groups

### Auth API

- Register creates workspace + owner + OTP.
- Verified owner can login.
- Unverified user cannot login.
- Login sets user status online.

### Platforms API

- Owner can create Telegram platform.
- Platform token is not returned in unsafe public response.
- Agent role cannot modify platform config.

### Agents API

- Owner can create agent.
- Agent can be assigned to platform.
- Agent child records persist correctly.

### Chats API

- Inbox returns workspace-scoped chats.
- Messages ordered ascending.
- Opening messages resets unread.
- Human send inserts message and calls mocked sender.
- Takeover prevents AI processing.

### Products API

- Owner can create category/product/variant.
- Inactive product hidden from customer-facing query.
- Variant stock rules are enforced if inventory is enabled.

### Cart/Checkout API

- Add to cart creates cart/session.
- Checkout creates snapshot.
- Checkout creates order and order_items.
- Cart cannot mix unsupported currencies.

### Payment API

- Create payment produces sandbox link.
- Webhook with valid signature updates payment.
- Webhook with invalid signature rejected.
- Duplicate webhook does not double-update order.

### Files API

- Upload stores file metadata.
- File belongs to workspace.
- Missing local file is reported clearly.

## Provider Mocks

| Provider | Mock Behavior |
|---|---|
| Telegram sender | Capture sent messages/buttons |
| AI provider | Return deterministic text/action |
| Payment provider | Return payment link and transaction id |
| File downloader | Return fixture file path |

## Acceptance

- Tests can run locally and in CI.
- Test DB is reset between suites.
- Provider calls are mocked unless test explicitly requires sandbox.
