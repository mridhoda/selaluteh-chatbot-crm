# Telegram Commerce Brief

## Purpose

Make Telegram the first commerce interface for MVP.

## Why Telegram

- Existing project already supports Telegram webhook.
- Telegram inline keyboard is suitable for deterministic actions.
- Faster to test than WhatsApp commerce.
- Payment can be external link.

## Main Telegram Actions

```txt
/start
product:list
product:detail:<product_id>
cart:add:<variant_id>
cart:view
cart:update:<cart_item_id>:<qty>
cart:remove:<cart_item_id>
cart:clear
checkout:start
checkout:confirm
order:status:<order_id>
```

## Customer Flow

```txt
/start
→ bot shows menu
→ customer taps View Products
→ bot shows product list
→ customer taps product
→ bot shows detail and Add to Cart
→ customer adds item
→ bot shows cart summary
→ customer checks out
→ bot sends payment link
→ bot sends paid notification after webhook
```

## Important Rules

- Do not rely only on free-text parsing for commerce.
- Use buttons for critical actions.
- Validate every callback payload.
- Do not expose internal IDs unnecessarily if callback token can be used.
- Duplicate Telegram webhook must not create duplicate cart/order/payment action.
- Human takeover should still work for support.

## AI Role in Telegram

AI can answer:

- product questions
- availability explanation
- recommendations
- FAQ
- support questions

AI should not perform payment/order finalization.
