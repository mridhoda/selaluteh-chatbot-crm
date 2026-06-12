# UI States

## Purpose

Every backend-driven UI must support states clearly.

## Global States

- loading
- empty
- error
- success
- unauthorized
- forbidden
- not found
- stale data
- saving
- deleting
- retrying

## Table States

### Loading

Show skeleton rows.

### Empty

Show helpful CTA.

Example:

```txt
Belum ada produk. Buat produk pertama untuk mulai menerima order dari Telegram.
```

### Error

Show retry button and error detail.

## Form States

- pristine
- dirty
- validating
- submitting
- success
- error

## Payment States

- creating payment link
- waiting payment
- paid
- failed
- expired
- webhook error
- duplicate webhook ignored

## Telegram States

- bot connected
- webhook not set
- webhook failed
- message received
- callback invalid
- duplicate ignored

## Chat States

- open
- resolved
- escalated
- human takeover
- AI active
- AI disabled

## Empty State CTAs

| Page | Empty State CTA |
|---|---|
| Products | Create Product |
| Orders | Wait for Telegram checkout or create test order |
| Payments | Create payment from order |
| Platforms | Connect Telegram |
| Agents | Create AI Agent |
| Chats | Send test message to bot |
