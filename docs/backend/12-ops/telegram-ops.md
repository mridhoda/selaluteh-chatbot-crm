# Telegram Operations

## Telegram Bot Operational Checklist

- [ ] Bot token configured.
- [ ] Webhook URL configured.
- [ ] Public backend URL reachable via HTTPS.
- [ ] `/start` works.
- [ ] Bot can send messages.
- [ ] Bot can send inline keyboards.
- [ ] Bot can receive callback queries.
- [ ] Bot can download files if needed.

## Common Telegram Issues

### Bot Does Not Reply

Possible causes:

- webhook not set
- wrong token
- backend down
- route error
- platform lookup failed
- AI provider error without fallback

### Callback Button Does Nothing

Possible causes:

- callback query not handled
- invalid callback payload
- product/cart id missing
- expired cart/session
- duplicate webhook skipped incorrectly

### Messages Duplicated

Possible causes:

- Telegram retried webhook
- missing idempotency
- platform_message_id not unique
- handler creates message before duplicate check

### AI Replies During Human Takeover

Possible causes:

- takeover_by check missing/broken
- chat lookup mismatch
- new chat created instead of existing chat

## Telegram Smoke Test

1. Send `/start`.
2. Tap product list.
3. Open product detail.
4. Add to cart.
5. View cart.
6. Checkout.
7. Confirm payment link message.
8. Trigger human takeover from admin.
9. Send user message and confirm AI does not reply.

## Telegram Webhook Change Procedure

1. Confirm new `PUBLIC_BASE_URL`.
2. Call setWebhook integration.
3. Verify provider response.
4. Send test message.
5. Check logs.
