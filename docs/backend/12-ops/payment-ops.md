# Payment Ops

## Xendit Test Mode Setup

Use Test Mode only for the current MVP.

Manual dashboard checklist:

1. Open Xendit Dashboard in Test Mode.
2. Create or select a Test Secret API Key.
3. Store it only in `server/.env` as `XENDIT_SECRET_API_KEY`.
4. Retrieve the webhook verification token.
5. Store it only in `server/.env` as `XENDIT_WEBHOOK_VERIFICATION_TOKEN`.
6. Set `PAYMENT_PROVIDER=xendit` and `XENDIT_MODE=test`.
7. Expose local backend through an HTTPS tunnel when testing locally.
8. Configure webhook URL: `<APP_PUBLIC_URL>/api/webhooks/xendit/payment-sessions`.
9. Subscribe to Payment Session status events.
10. Restart backend and run manual test flow.

Do not paste real secrets into chat, docs, source code, screenshots, or logs.

## Required Environment

```env
PAYMENT_PROVIDER=xendit
XENDIT_MODE=test
XENDIT_API_BASE_URL=https://api.xendit.co
XENDIT_SECRET_API_KEY=
XENDIT_WEBHOOK_VERIFICATION_TOKEN=
XENDIT_PAYMENT_COUNTRY=ID
XENDIT_PAYMENT_CURRENCY=IDR
XENDIT_PAYMENT_SESSION_MODE=PAYMENT_LINK
XENDIT_PAYMENT_CAPTURE_METHOD=AUTOMATIC
XENDIT_PAYMENT_SESSION_TTL_MINUTES=30
```

## Operational Checks

- `GET /api/payments/gateway/config` returns provider `xendit`, environment `test`, and configured boolean.
- `POST /api/orders/:orderId/payments/xendit/session` returns a hosted checkout URL.
- The payment row stores provider session ID, merchant reference, payment link URL, amount, currency, and expiry.
- Webhook events update payment status only after token verification and amount/currency/reference checks.
- Paid payments are not downgraded by stale events.

## Incident Notes

If payment is completed in Xendit but internal state remains pending:

1. Check webhook delivery in Xendit dashboard.
2. Confirm the configured URL is `/api/webhooks/xendit/payment-sessions`.
3. Confirm `XENDIT_WEBHOOK_VERIFICATION_TOKEN` matches the dashboard token.
4. Use `POST /api/payments/:paymentId/refresh` to reconcile from provider status.
5. Do not manually mark paid unless an audited admin process is explicitly approved.
