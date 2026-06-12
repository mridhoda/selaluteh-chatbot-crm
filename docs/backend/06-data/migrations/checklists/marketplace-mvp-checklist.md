# Telegram Marketplace MVP Checklist

## Product Catalog

- [ ] Admin can create category.
- [ ] Admin can create product.
- [ ] Product has price, status, and optional image.
- [ ] Product can be archived without deleting historical order references.
- [ ] Product list API is workspace scoped.

## Telegram Flow

- [ ] `/start` shows marketplace menu.
- [ ] Product list button works.
- [ ] Product detail button works.
- [ ] Add-to-cart callback works.
- [ ] Duplicate callback does not duplicate cart item/order.
- [ ] View cart works.
- [ ] Checkout asks missing customer info.
- [ ] Confirm checkout creates order.

## Cart / Checkout

- [ ] Active cart is unique per contact/chat where intended.
- [ ] Cart item quantity can be increased/decreased.
- [ ] Cart totals are recalculated server-side.
- [ ] Checkout snapshots customer data.
- [ ] Order snapshots product data into `order_items`.

## Payment Sandbox

- [ ] Midtrans/Xendit sandbox keys are server-side only.
- [ ] Payment link can be generated for order.
- [ ] Payment row is created.
- [ ] Payment webhook signature is verified.
- [ ] Payment event is saved.
- [ ] Order becomes paid only after verified webhook.
- [ ] Telegram paid notification is sent once.

## AI Guardrails

- [ ] AI can recommend products.
- [ ] AI cannot mark payment as paid.
- [ ] AI cannot bypass checkout confirmation.
- [ ] AI commerce action is logged in `ai_actions`.
- [ ] Human takeover disables AI replies.

## Admin

- [ ] Orders page shows order items.
- [ ] Orders page shows payment status.
- [ ] Admin can update fulfillment status.
- [ ] Admin can inspect Telegram chat related to order.
