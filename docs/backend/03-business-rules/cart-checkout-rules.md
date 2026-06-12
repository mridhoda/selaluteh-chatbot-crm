# Cart and Checkout Rules

## Cart Rule

Cart is bound to one outlet:

```txt
cart.workspace_id
cart.outlet_id
cart.contact_id
```

## Add Item

Backend validates:

- outlet exists and active
- product belongs to workspace
- product available at outlet
- cart outlet matches active outlet
- price computed server-side

## Checkout Rule

Checkout copies outlet_id from cart and revalidates:

- outlet status
- product availability
- price
- stock if enabled
- cart ownership/contact

## Forbidden

- checkout without outlet
- mixed-outlet cart
- client-supplied totals
