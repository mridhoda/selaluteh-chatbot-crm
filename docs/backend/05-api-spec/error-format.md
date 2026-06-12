# Error Format

## Standard Error Response

All API errors should use this shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "email",
        "message": "Email is required."
      }
    ],
    "request_id": "req_019..."
  }
}
```

## Error Codes

| Code | HTTP | Meaning |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Request body/query invalid |
| `UNAUTHENTICATED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | User cannot access resource |
| `NOT_FOUND` | 404 | Resource not found or outside workspace |
| `CONFLICT` | 409 | Duplicate or conflicting state |
| `BUSINESS_RULE_FAILED` | 422 | Valid request, invalid business action |
| `RATE_LIMITED` | 429 | Too many requests |
| `WEBHOOK_SIGNATURE_INVALID` | 401 | Invalid provider webhook signature |
| `PAYMENT_NOT_READY` | 422 | Payment cannot be created for current order/cart state |
| `ORDER_ALREADY_PAID` | 409 | Order is already paid |
| `CART_EMPTY` | 422 | Checkout attempted with empty cart |
| `PRODUCT_UNAVAILABLE` | 422 | Product or variant cannot be purchased |
| `AI_ACTION_REJECTED` | 422 | AI action failed validation |
| `INTERNAL_ERROR` | 500 | Unexpected backend error |

## Validation Details

Use field-level errors when possible:

```json
{
  "field": "items[0].quantity",
  "message": "Quantity must be greater than 0."
}
```

## Security Rule

Never expose:

- API keys.
- Provider tokens.
- Internal DB connection strings.
- Supabase service role key.
- Full webhook signatures.
- Raw stack traces in production.

## Workspace Isolation Rule

For security, resource outside workspace should return:

```txt
404 NOT_FOUND
```

not:

```txt
403 FORBIDDEN
```

This prevents leaking whether another workspace resource exists.
