# Milestones

Dokumen ini memecah backend MVP menjadi milestone besar.

## M0 — Project Recovery & Safety

Goal:

```txt
Existing backend tetap jalan, risiko keamanan besar ditutup, dan project siap dilanjutkan.
```

Includes:

- Orders route secured.
- Complaints route secured.
- Diagnostic routes removed/protected.
- Settings route status fixed.
- Telegram webhook existing behavior preserved.
- Basic smoke test documented.

Exit criteria:

- Login works.
- Dashboard loads.
- Inbox loads.
- Telegram webhook receives message.
- Human takeover still skips AI.
- Orders/complaints require auth.

## M1 — Repository Layer & Data Boundary

Goal:

```txt
Backend tidak lagi terlalu bergantung langsung pada Mongoose route logic.
```

Includes:

- Repository folder introduced.
- Workspace scoped query helpers.
- Service layer for chat/message/order/complaint.
- AI side effects moved into services.
- Webhook idempotency planned or implemented.

Exit criteria:

- Existing routes still work.
- New code uses repository/service boundary.
- Workspace validation is centralized.

## M2 — Supabase/Postgres Migration Foundation

Goal:

```txt
Target Postgres schema siap diuji di staging.
```

Includes:

- SQL migrations reviewed.
- Import script dry run.
- Local file metadata migration plan.
- RLS reviewed.
- Migration validation queries prepared.

Exit criteria:

- Fresh Supabase project can run migrations.
- Sample Mongo data can be mapped to UUIDs.
- Import dry run generates report.

## M3 — Marketplace Data Model

Goal:

```txt
Commerce primitives tersedia di backend.
```

Includes:

- Product categories.
- Products.
- Product variants.
- Product images.
- Carts.
- Cart items.
- Checkouts.
- Order items.
- Payments.
- Payment events.

Exit criteria:

- Admin can create product.
- Telegram/cart service can query active products.
- Order can store normalized order items.

## M4 — Telegram Commerce Flow

Goal:

```txt
Telegram user bisa browse product dan membuat cart.
```

Includes:

- `/start` marketplace menu.
- Product list.
- Product detail.
- Add to cart.
- View cart.
- Update quantity.
- Clear cart.

Exit criteria:

- User can add product to cart from Telegram.
- Cart state is deterministic.
- AI is not required for basic commerce flow.

## M5 — Checkout & Payment Sandbox

Goal:

```txt
User bisa checkout dan menerima payment link sandbox.
```

Includes:

- Checkout confirmation.
- Pending order creation.
- Payment provider abstraction.
- Midtrans/Xendit/manual sandbox.
- Payment webhook.
- Signature verification.
- Paid notification to Telegram.

Exit criteria:

- Payment webhook updates payment status.
- Order status updates from payment.
- Duplicate webhook does not double-process payment.

## M6 — Admin Operations

Goal:

```txt
Admin bisa mengelola produk, order, payment, dan chat.
```

Includes:

- Product CRUD UI/API.
- Order detail with order items.
- Payment status view.
- Customer chat context.
- Manual order status update.

Exit criteria:

- Admin can operate MVP without database access.
- Existing CRM inbox remains useful.

## M7 — MVP Hardening & Demo

Goal:

```txt
Backend siap demo MVP end-to-end.
```

Includes:

- Regression testing.
- Webhook tests.
- Payment tests.
- Security checklist.
- Observability.
- Release checklist.

Exit criteria:

- End-to-end demo works:
  Telegram → product → cart → checkout → payment → paid order.
