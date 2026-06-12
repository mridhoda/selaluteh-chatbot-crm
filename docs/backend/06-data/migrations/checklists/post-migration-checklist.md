# Post-Migration Checklist — v2

## Data Counts

- [ ] Users count matches expected.
- [ ] Platforms count matches expected.
- [ ] Agents count matches expected.
- [ ] Contacts count matches expected.
- [ ] Chats count matches expected.
- [ ] Messages count matches expected.
- [ ] Legacy orders count matches expected.
- [ ] Complaints count matches expected.
- [ ] Files metadata count matches migrated attachments.
- [ ] Local media files exist on server.
- [ ] Product catalog count matches expected if bootstrapped.

## App Smoke Tests

- [ ] Login works.
- [ ] Billing loads.
- [ ] Profile loads.
- [ ] Platforms page loads.
- [ ] Agents page loads.
- [ ] Inbox loads.
- [ ] Chat messages load in correct order.
- [ ] Unread reset works.
- [ ] Takeover works.
- [ ] Human reply sends and stores message.
- [ ] AI reply works.
- [ ] AI escalation sets `is_escalated`.
- [ ] Legacy order status update works.
- [ ] Complaint status update works.
- [ ] Local `/files` URLs resolve.

## Security Tests

- [ ] User cannot read another workspace's chats.
- [ ] User cannot read another workspace's contacts.
- [ ] User cannot read another workspace's products.
- [ ] User cannot read another workspace's orders.
- [ ] Agent role cannot see unassigned workspace chats unless intended.
- [ ] Service role key is not exposed to frontend.
- [ ] Payment webhook endpoint rejects invalid signature.
- [ ] Telegram duplicate update does not create duplicate message/order.

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
- [ ] Order status becomes `paid` after payment webhook.
- [ ] Telegram paid notification is sent.
