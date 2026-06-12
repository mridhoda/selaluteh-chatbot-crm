# Smoke Test Checklist

## Purpose

Quick test after deploy or migration.

## Backend Health

- [ ] `GET /health` or equivalent works.
- [ ] Database connection works.
- [ ] Upload directory exists and writable.
- [ ] Required env variables loaded.

## Auth/Admin

- [ ] Owner can login.
- [ ] Dashboard loads.
- [ ] Platforms page loads.
- [ ] Agents page loads.
- [ ] Inbox loads.

## Telegram

- [ ] Telegram webhook receives test message.
- [ ] Contact/chat/message created.
- [ ] Bot sends reply.
- [ ] Duplicate payload does not duplicate message.

## Commerce

- [ ] Product list loads.
- [ ] Add to cart works.
- [ ] Checkout creates order.
- [ ] Payment link generated in sandbox.
- [ ] Payment webhook marks order paid.

## AI/Human

- [ ] AI replies when takeover inactive.
- [ ] Human takeover disables AI reply.
- [ ] Human reply sends to Telegram.

## Security Quick Check

- [ ] Unauthenticated orders request is rejected.
- [ ] Cross-workspace data access is rejected.
- [ ] Invalid payment webhook signature rejected.
