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
-> Browse Products
-> Select Salty Caramel
-> Add to Cart
-> View Cart
-> Checkout
-> Confirm
-> Receive Payment Link
-> Payment Paid Webhook
-> Receive Paid Notification
```

## Edge Cases

- User taps old callback after product inactive.
- User taps checkout with empty cart.
- User adds out-of-stock variant.
- User sends random text during checkout.
- User has active human takeover.
- User has expired checkout.
- User tries to checkout twice.
- User asks AI to mark order as paid.

## Assertions

- Telegram callback data maps to valid backend action.
- Backend validates workspace/platform/contact.
- Cart state remains consistent.
- Order is created once.
- Payment link is tied to the correct order/contact.

## Manual QA Checklist

- [ ] Buttons are understandable.
- [ ] Bot messages are not too long.
- [ ] Errors are friendly.
- [ ] User can recover from mistakes.
- [ ] Admin can see the conversation in CRM inbox.
