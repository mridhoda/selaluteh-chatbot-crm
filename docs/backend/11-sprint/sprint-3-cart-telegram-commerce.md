# Sprint 3 — Cart & Telegram Commerce

## Objective

Allow Telegram users to browse products and manage cart.

## Scope

- Telegram inline buttons.
- Cart persistence.
- Add/update/remove cart items.

## Telegram Actions

```txt
/start
product:list
product:detail:<id>
cart:add:<variant_id>
cart:view
cart:update:<item_id>:<qty>
cart:clear
checkout:start
```

## Tasks

- [ ] Inline keyboard sender helper.
- [ ] Callback payload parser.
- [ ] Product list callback.
- [ ] Product detail callback.
- [ ] Cart model/service.
- [ ] Add to cart callback.
- [ ] View cart callback.
- [ ] Quantity update callback.

## Acceptance Criteria

- Customer can add product to cart from Telegram.
- Cart total is backend-calculated.
- Invalid callback payload is safely rejected.
