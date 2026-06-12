# TDD Rules

## Philosophy

Tidak semua fitur wajib strict TDD, tapi fitur yang berisiko tinggi harus punya test sebelum atau bersamaan dengan implementasi.

## Must-Test-First Areas

Write tests before implementation for:

1. Payment webhook verification.
2. Payment/order status transitions.
3. Webhook idempotency.
4. Workspace isolation.
5. Cart total calculation.
6. Checkout snapshot logic.
7. AI action validation.
8. Migration mapping and reference validation.

## Test Naming

```txt
<feature>.<type>.test.js
```

Examples:

```txt
payment-webhook.integration.test.js
cart-total.unit.test.js
telegram-idempotency.integration.test.js
workspace-isolation.security.test.js
```

## Red-Green-Refactor Flow

1. Write failing test for intended behavior.
2. Implement minimal code to pass.
3. Refactor without changing behavior.
4. Add edge case tests.
5. Update docs if contract changes.

## When Test Can Come After

Acceptable for:

- Pure UI copy change.
- Temporary prototype behind feature flag.
- Internal admin-only cosmetic tweak.

But still add regression checklist if it touches existing flow.

## Do Not Mock Too Much

Unit tests can mock everything external. Integration tests should not mock repository/database layer unless target is service-only.

## Test Contract Rule

If a doc in `05-api-spec`, `06-data`, or `03-business-rules` changes, update tests accordingly.
