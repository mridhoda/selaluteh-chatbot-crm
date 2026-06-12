# Testing Expectations

Dokumen ini menjelaskan minimum testing expectation untuk AI coding agent.

## Required Testing Mindset

Sebelum menyelesaikan task, AI agent harus menyebutkan:

- apa yang diubah,
- cara menjalankan test/manual check,
- risiko yang tersisa,
- file penting yang disentuh.

## Critical Manual Smoke Tests

After backend changes:

- login owner works,
- dashboard loads,
- platforms page loads,
- chats list loads,
- chat messages ordered correctly,
- human reply sends,
- takeover skips AI,
- Telegram test webhook still works.

## Marketplace Smoke Tests

If product/cart/order changed:

- owner can create product,
- Telegram user can view product list,
- user can add item to cart,
- cart total is correct,
- checkout creates pending order,
- order_items match cart items,
- AI cannot create paid order.

## Payment Smoke Tests

If payment changed:

- payment link can be created in sandbox/mock,
- webhook signature validation exists,
- duplicate webhook does not double update,
- order becomes paid only after valid event,
- Telegram notification is sent or queued.

## Migration Smoke Tests

If data migration changed:

- run dry run first,
- validate count parity,
- validate workspace ids,
- validate timestamps,
- validate local file metadata,
- check orphan records.

## Automated Test Preference

Prefer tests for:

- pure service logic,
- repository query contract,
- webhook idempotency,
- payment status mapping,
- cart/order total calculation.
