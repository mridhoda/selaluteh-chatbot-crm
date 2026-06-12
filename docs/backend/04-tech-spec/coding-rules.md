<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Coding Rules

## General Rules

1. Keep route handlers thin.
2. Put business logic in services.
3. Put all database access in repositories.
4. Validate all request input.
5. Always pass `workspaceId` for tenant data.
6. Never trust client-sent totals/prices.
7. Use idempotency for webhooks and payment events.
8. Avoid large refactors while migrating.

## Naming

JavaScript:

```txt
camelCase for variables
PascalCase for classes/types
SCREAMING_SNAKE_CASE for constants/env keys
```

Postgres:

```txt
snake_case for tables/columns
plural table names
```

## Route Pattern

```js
router.post('/products', authRequired, validate(createProductSchema), asyncHandler(async (req, res) => {
  const result = await productService.createProduct({
    workspaceId: req.user.workspaceId,
    userId: req.user.id,
    data: req.body
  })

  res.status(201).json(result)
}))
```

## Service Pattern

```js
async function createProduct({ workspaceId, userId, data }) {
  const normalized = normalizeProductInput(data)
  return productsRepository.create({ workspaceId, createdBy: userId, data: normalized })
}
```

## Repository Pattern

```js
async function findById({ workspaceId, productId }) {
  return db
    .from('products')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', productId)
    .single()
}
```

## Error Handling

Use typed app errors:

```js
throw new AppError('PRODUCT_NOT_FOUND', 404, 'Product not found')
```

Do not leak internal provider/database details to user responses.

## Validation

Use a validation library such as Zod/Joi/Yup or existing validation style.

Validate:

- IDs are UUIDs
- quantities positive
- prices non-negative
- enum values valid
- file types allowed
- webhook required fields exist

## Money Rules

- Store money as integer minor units: IDR rupiah amount as integer.
- Never use floating point for money.
- Order totals are computed server-side.
- Order items must snapshot product name, variant, price at checkout time.

## AI Rules

- AI output is untrusted.
- Parse AI JSON defensively.
- Validate product/order IDs from AI against workspace.
- AI cannot call payment status update directly.

## Payment Rules

- Payment webhook must be idempotent.
- Verify signature before state update.
- Compare amount/currency.
- Store raw event.
- Do not update paid order back to pending.

## File Rules

- Sanitize filenames.
- Store generated safe filename.
- Store only relative path in database.
- Validate mime type and size.
- Do not trust user-provided extension.

## Testing Rules

Every new service should have at least:

- success test
- validation failure test
- workspace isolation test
- idempotency test if webhook/payment related
