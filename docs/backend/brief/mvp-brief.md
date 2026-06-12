# MVP Brief

## MVP Goal

Prove that a customer can complete a product purchase flow from Telegram while the backend keeps structured order and payment state.

## MVP Success Demo

The MVP is successful if this flow works end-to-end:

```txt
Telegram bot opens
→ product list shown
→ customer adds product to cart
→ customer confirms checkout
→ backend creates pending order
→ backend creates payment link
→ payment webhook marks payment paid
→ backend updates order status
→ Telegram sends paid confirmation
→ admin sees paid order
```

## MVP Users

### Customer

Uses Telegram to:

- Browse products.
- Ask questions.
- Add items to cart.
- Checkout.
- Pay.
- Receive order updates.

### Admin

Uses dashboard to:

- Manage products.
- View orders.
- View payment status.
- Monitor chats.
- Take over AI conversation.
- Handle complaints.

### AI Agent

Helps with:

- Product explanation.
- Product recommendation.
- FAQ.
- Checkout guidance.
- Escalation to human.

AI must not:

- Mark payment as paid.
- Override product price.
- Create final order without backend validation.
- Ignore cart/checkout confirmation.

## MVP Must-Haves

- Secure auth and workspace isolation.
- Product catalog.
- Cart service.
- Checkout service.
- Order items.
- Payment record.
- Payment webhook.
- Telegram inline keyboard actions.
- Webhook idempotency.
- Admin order visibility.

## MVP Should-Haves

- AI product Q&A.
- Basic analytics.
- Payment event view.
- Human takeover context.
- Order status command.

## MVP Not Included

- Multi-seller.
- Payout.
- Commission.
- Voucher.
- Logistics integration.
- Refund automation.
- Advanced inventory reservation.
