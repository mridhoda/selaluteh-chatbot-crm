# Test Data

## Purpose

Define reusable fixtures for local, integration, staging, and migration tests.

## Core Fixtures

### Workspace

```json
{
  "name": "Test Workspace"
}
```

### Users

| Role | Email | Purpose |
|---|---|---|
| owner | owner@test.local | Full access |
| super | super@test.local | Workspace admin |
| agent | agent@test.local | Human takeover tests |
| outsider | outsider@test.local | Cross-workspace denial tests |

### Platform

```json
{
  "type": "telegram",
  "label": "Test Telegram Bot",
  "token": "TEST_TELEGRAM_TOKEN",
  "enabled": true
}
```

### Agent

```json
{
  "name": "Default AI Agent",
  "welcome_message": "Halo! Ada yang bisa saya bantu?",
  "behavior": "Helpful customer service and shopping assistant."
}
```

### Products

| Product | Variant | Price | Stock | Status |
|---|---|---:|---:|---|
| Salty Caramel | Regular | 25000 | 100 | active |
| Aren Latte | Regular | 23000 | 100 | active |
| Secret Menu | Regular | 99999 | 0 | inactive |

### Telegram Contact

```json
{
  "platform_type": "telegram",
  "platform_account_id": "tg_user_001",
  "name": "Test Telegram User",
  "handle": "@testuser"
}
```

## Webhook Fixtures

Create fixtures for:

```txt
telegram-text-message.json
telegram-start-command.json
telegram-callback-query.json
telegram-photo-message.json
telegram-duplicate-message.json
payment-paid-webhook.json
payment-invalid-signature-webhook.json
meta-whatsapp-message.json
```

## Payment Fixtures

| Status | Use |
|---|---|
| pending | Created payment link |
| paid | Successful sandbox webhook |
| expired | Expired payment |
| failed | Failed payment |
| refunded | Future/refund tests |

## Data Reset

Integration tests should reset tables in dependency order or recreate database schema for every test suite.
