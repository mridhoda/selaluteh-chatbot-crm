# MVP Principles

## 1. Prove the Transaction Flow First

The MVP must prove:

```txt
chat → product → cart → checkout → payment → paid order
```

Do not optimize for advanced features before this works.

## 2. Single Merchant First

The MVP is single-merchant.

Avoid building:

- seller onboarding
- wallet seller
- payout
- commission
- seller dispute

Those are future marketplace features.

## 3. Backend Owns Commerce State

The backend must be the source of truth for:

- product price
- product status
- cart items
- checkout summary
- order status
- payment status
- inventory rules

AI must not become the source of truth.

## 4. AI Assists, Backend Validates

AI can:

- answer questions
- recommend products
- explain product details
- help user navigate checkout
- escalate to human

AI cannot:

- mark payment as paid
- create final order without backend validation
- override price
- ignore inventory/status
- bypass checkout confirmation

## 5. Preserve Existing CRM

Marketplace work must not break existing CRM features:

- login
- dashboard
- inbox
- platform connection
- AI agent
- human takeover
- contacts
- messages

## 6. Security Before Payment

Before payment work:

- orders API must be protected
- complaints API must be protected
- workspace isolation must exist
- webhook idempotency must exist
- diagnostic routes must be protected/removed

## 7. Payment Webhook Is Authoritative

Payment status should be updated from:

- verified payment webhook
- authorized admin action for manual mode

Never from user text or AI response.

## 8. Keep Storage Practical

Use local server storage for large media files.

Use database for metadata only.

## 9. Keep Documentation Modular

- Overview goes here.
- Product details go to `01-product`.
- Flows go to `02-flows`.
- Business rules go to `03-business-rules`.
- Tech architecture goes to `04-tech-spec`.
- API contracts go to `05-api-spec`.
- Database docs go to `06-data`.
- Security docs go to `08-security`.
- AI context goes to `09-ai-context`.
- Testing docs go to `10-testing`.
- Sprint docs go to `11-sprint`.
