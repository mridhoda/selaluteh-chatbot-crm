# Post-Cutover Checklist — Supabase Fresh Start

## Runtime Smoke Tests

- [ ] Login works with custom backend auth.
- [ ] Billing loads.
- [ ] Profile loads.
- [ ] Platforms page loads.
- [ ] Agents page loads.
- [ ] Inbox loads.
- [ ] Chat messages load in correct order.
- [ ] Cart, checkout, order, and payment detail pages show normalized item/event rows.
- [ ] Unread reset works.
- [ ] Takeover works.
- [ ] Human reply sends and stores message.
- [ ] AI reply works.
- [ ] AI escalation sets `is_escalated`.
- [ ] Order status update works.
- [ ] Complaint status update works.
- [ ] Local `/files` URLs resolve.

## Security Tests

- [ ] User cannot read another workspace's chats.
- [ ] User cannot read another workspace's contacts.
- [ ] User cannot read another workspace's products.
- [ ] User cannot read another workspace's orders.
- [ ] Agent role cannot see unassigned workspace chats unless intended.
- [ ] Service role key is not exposed to frontend.
- [ ] `SUPABASE_DATABASE_URL` is not exposed to frontend.
- [ ] Payment webhook endpoint rejects invalid signature.
- [ ] Telegram duplicate update does not create duplicate message/order.
- [ ] Duplicate payment provider event does not create duplicate `payment_events` row.
- [ ] Platform and payment secrets are redacted in API responses and logs.

## Marketplace Smoke Tests

- [ ] Admin can create/update/archive product.
- [ ] Telegram product list works.
- [ ] Telegram product detail works.
- [ ] Add to cart works.
- [ ] View cart works.
- [ ] Checkout confirmation works.
- [ ] Pending order is created with order items.
- [ ] Payment sandbox link is created.
- [ ] Payment event is saved.
- [ ] Order payment status becomes `paid` after payment webhook.
- [ ] Order lifecycle status remains separate from payment status.
- [ ] Telegram paid notification is sent.

## SQL Validation

- [ ] `sql/009_migration_validation_queries.sql` returns zero for orphan and cross-workspace mismatch queries.
- [ ] Duplicate checks for checkout idempotency keys, order numbers, webhook events, and payment events return no rows.
- [ ] Legacy `mongo_id_map` validation is ignored unless a separate historical import spec is opened.

## Final Mongo Removal Gate

- [ ] All runtime domains are Supabase-backed.
- [ ] Full regression/security tests pass.
- [ ] Mongo connection/bootstrap code removed.
- [ ] Mongoose models removed.
- [ ] Mongoose dependency removed.
- [ ] MongoMemoryServer removed.
- [ ] `DATA_SOURCE=mongo` fallback removed.
- [ ] Obsolete Mongo environment variables removed.
- [ ] Affected docs/specs updated and generated bundles regenerated.
