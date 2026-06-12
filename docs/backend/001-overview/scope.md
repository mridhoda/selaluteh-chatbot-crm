# Scope

## MVP Scope

The MVP focuses on a Telegram-first commerce experience built on the existing Chatbot CRM.

## In Scope

### Existing CRM Preservation

- Auth/login.
- Dashboard.
- Platforms.
- Agents.
- Inbox/chats.
- Contact management.
- Human takeover.
- AI reply.
- Legacy orders/complaints compatibility.

### Telegram Commerce

- `/start` menu.
- Product list.
- Product detail.
- Add to cart.
- View cart.
- Update quantity.
- Checkout confirmation.
- Payment link message.
- Order status message.

### Product Catalog

- Product category.
- Product.
- Product variant.
- Product status.
- Product image metadata.
- Admin product CRUD.

### Cart and Checkout

- Cart per Telegram customer/session.
- Cart items.
- Cart total calculation.
- Checkout confirmation.
- Pending order creation.
- Order items snapshot.

### Payment

- Payment provider abstraction.
- Sandbox payment link.
- Payment webhook endpoint.
- Signature verification.
- Payment event logging.
- Order status update after payment.
- Telegram paid notification.

### Admin Operations

- Product management.
- Order list.
- Order detail.
- Payment status.
- Customer chat context.
- Manual support through human takeover.

### Data Layer

- Preserve current MongoDB behavior initially.
- Prepare Supabase/Postgres migration path.
- Use workspace-scoped data.
- Keep large media in local server storage.
- Store file metadata in database.

## Out of Scope for MVP

- Multi-seller marketplace.
- Seller wallet.
- Seller payout.
- Commission engine.
- Review/rating system.
- Voucher/promo system.
- Logistics provider integration.
- Refund automation.
- Public web storefront.
- Native Telegram payment integration.
- Native WhatsApp payment.
- Advanced AI recommendation engine.
- Full Supabase Auth migration if not needed for MVP.

## Future Scope

After MVP:

- WhatsApp commerce.
- Instagram commerce.
- Multi-seller.
- Payout and commission.
- Advanced analytics.
- AI campaign generator.
- Customer segmentation.
- RAG-based product/FAQ knowledge base.
- Protected media endpoint.
