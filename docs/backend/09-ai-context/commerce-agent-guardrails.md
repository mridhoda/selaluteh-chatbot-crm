# Commerce Agent Guardrails

## Outlet Context Required

AI must check active outlet before:

- product recommendation
- add to cart
- checkout

## Product Recommendation

AI may only recommend:

- active products
- telegram-visible products
- products available in active outlet

## Payment

AI can explain payment link, but payment success comes from provider webhook.
