# Telegram Commerce Test Plan

## Goal

Validate Telegram-first shopping flow.

## Commands and Buttons

Test:

- `/start`.
- Browse products.
- View product detail.
- Add to cart.
- Increase/decrease quantity.
- View cart.
- Checkout.
- Pay now.
- Check order status.
- Talk to admin.

## Happy Path

```txt
/start
-> Select Outlet
-> Browse Products
-> Select Salty Caramel
-> Add to Cart
-> View Cart
-> Checkout
-> Confirm
-> Receive Payment Link or Manual/COD Instruction
-> Payment Paid Webhook
-> Receive Paid Notification
```

When `PAYMENT_PROVIDER=xendit`, the payment link is a Xendit Test Mode hosted checkout URL returned by backend session creation.

## Edge Cases

- User taps old callback after product inactive.
- User taps checkout with empty cart.
- User adds out-of-stock variant.
- User sends random text during checkout.
- User has active human takeover.
- User has expired checkout.
- User tries to checkout twice.
- User asks AI to mark order as paid.
- Telegram callback is retried and must not create duplicate Xendit sessions.
- Xendit webhook is delivered twice and must not send duplicate paid notification.

## Assertions

- Telegram callback data maps to valid backend action.
- Backend validates workspace/platform/contact.
- Outlet selection stores chat/contact outlet context.
- Product list requires active outlet context.
- Product list only shows products available in selected outlet.
- Cart state remains consistent.
- Order is created once.
- Payment link is tied to the correct order/contact.
- Xendit payment link is created from authoritative order total.
- Xendit Test Mode link is stored in payment row and returned/sent safely.
- Manual/COD instruction is shown when `PAYMENT_PROVIDER=manual`.
- Versioned callback data rejects stale callbacks when version is obsolete.

## Automated Coverage Current State

```txt
telegram-commerce-outlet.integration.test.js
cart-service.integration.test.js
checkout-service.integration.test.js
order-service.integration.test.js
payment-attempt.integration.test.js
payment-webhook.integration.test.js
xendit-client.unit.test.js
webhook-parsers.unit.test.js
```

Current passing suite covers outlet selection, outlet-scoped catalog, cart/checkout/order/payment attempt, Xendit adapter payload/status/token mapping, payment webhook paid transition, and webhook parser normalization.

## Manual QA Checklist

- [ ] Buttons are understandable.
- [ ] Bot messages are not too long.
- [ ] Errors are friendly.
- [ ] User can recover from mistakes.
- [ ] Admin can see the conversation in CRM inbox.
- [ ] Xendit Test Mode checkout link opens and returns webhook in local tunnel test.
- [ ] Duplicate Xendit webhook does not duplicate Telegram success message.
