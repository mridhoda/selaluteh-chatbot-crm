# Regression Checklist

## Purpose

Checklist ini dijalankan sebelum release besar, terutama setelah perubahan database, webhook, payment, atau AI flow.

## Auth

- [ ] Register owner works.
- [ ] OTP verification works.
- [ ] Login works.
- [ ] Logout/status offline works.
- [ ] Reset password works.
- [ ] Agent role cannot access owner-only routes.

## Dashboard

- [ ] Dashboard loads.
- [ ] Billing/profile loads.
- [ ] Platforms page loads.
- [ ] Agents page loads.
- [ ] Inbox loads.
- [ ] Contacts page loads.
- [ ] Orders page loads.
- [ ] Complaints page loads.

## Telegram

- [ ] `/start` works.
- [ ] Text message is saved.
- [ ] Photo/document attachment is saved.
- [ ] Callback query is processed.
- [ ] Duplicate payload does not duplicate message.
- [ ] AI reply is sent when takeover inactive.
- [ ] AI reply is skipped when takeover active.

## Marketplace

- [ ] Product list visible.
- [ ] Product detail visible.
- [ ] Add to cart works.
- [ ] View cart works.
- [ ] Checkout works.
- [ ] Order items are correct.
- [ ] Payment link generated.
- [ ] Paid webhook updates order.
- [ ] Duplicate payment webhook ignored.

## Security

- [ ] Orders require auth.
- [ ] Complaints require auth.
- [ ] Workspace isolation enforced.
- [ ] Service role key not exposed to frontend.
- [ ] Invalid payment signature rejected.

## Storage

- [ ] Incoming media stored locally.
- [ ] File metadata row created.
- [ ] Public file URL resolves if intended.
- [ ] Upload folder persists across restart.

## Migration

- [ ] SQL migrations apply cleanly.
- [ ] Backfill counts match.
- [ ] Required FK null checks are zero.
- [ ] Timestamps preserved.
