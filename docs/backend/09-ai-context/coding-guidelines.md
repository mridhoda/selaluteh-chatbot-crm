# Coding Guidelines for AI Agents

Dokumen ini memberi panduan gaya implementasi untuk AI coding agent.

## General Rules

- Make small, focused changes.
- Prefer service/repository boundary over huge route handlers.
- Avoid large refactors unless task explicitly asks for it.
- Keep existing API response shape unless docs are updated.
- Always validate workspace ownership.
- Keep file paths portable.

## Naming

Current Mongo code uses camelCase. Target Postgres uses snake_case. Repository layer should normalize field mapping.

Use clear domain names:

```txt
ProductService
CartService
CheckoutService
OrderService
PaymentService
TelegramCommerceService
AiActionService
```

## Error Handling

Return safe errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be at least 1."
  }
}
```

Do not expose stack trace to client.

## Side Effects

Side effects should be explicit:

- send Telegram message,
- create order,
- update payment,
- write file,
- call AI provider.

Avoid hiding side effects inside helper functions with vague names.

## Environment

Read env from config module where possible. Do not scatter `process.env` everywhere.

## Logging

Log:

- request id/event id,
- provider event id,
- workspace id,
- chat/order/payment id.

Do not log secrets or full payment payload with sensitive fields.
