# Integrations API

## Purpose

Endpoint integration dipakai untuk menghubungkan platform eksternal ke workspace, terutama setup webhook Telegram, WhatsApp/Instagram Meta, dan provider payment sandbox/production.

Dokumen ini berbeda dari `platforms-api.md`:

- `platforms-api.md` menjelaskan CRUD data platform.
- `integrations-api.md` menjelaskan aksi teknis yang memanggil provider eksternal, seperti `setWebhook`, verify token, test connection, dan sync status.

## Auth

Semua endpoint integration dashboard wajib memakai JWT Bearer token.

```http
Authorization: Bearer <jwt>
```

Role minimal:

| Action | Allowed Roles |
|---|---|
| Set Telegram webhook | owner, super |
| Test platform connection | owner, super |
| Disconnect platform | owner, super |
| Payment provider setup/test | owner, super |

## POST /api/v1/integrations/telegram/:platform_id/set-webhook

Set webhook Telegram untuk platform tertentu.

### Request

```json
{
  "public_base_url": "https://api.example.com"
}
```

If `public_base_url` is omitted, backend may use `PUBLIC_BASE_URL` from environment config.

### Behavior

1. Validate authenticated user workspace.
2. Load platform by `platform_id` and `workspace_id`.
3. Validate `platform.type = telegram`.
4. Build webhook URL:

```txt
{PUBLIC_BASE_URL}/webhook/telegram/{platform.webhook_secret_or_token_hash}
```

5. Call Telegram Bot API `setWebhook`.
6. Store webhook status metadata on platform if available.
7. Return provider response summary.

### Response

```json
{
  "success": true,
  "data": {
    "platform_id": "uuid",
    "provider": "telegram",
    "webhook_url": "https://api.example.com/webhook/telegram/<redacted>",
    "status": "active"
  }
}
```

## POST /api/v1/integrations/telegram/:platform_id/test-message

Send a test Telegram message to a configured admin/test chat id.

### Request

```json
{
  "chat_id": "123456789",
  "text": "Test message from SelaluTeh CRM"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "sent": true,
    "provider_message_id": "123"
  }
}
```

## GET /api/v1/integrations/telegram/:platform_id/webhook-info

Fetch Telegram webhook info from provider.

### Response

```json
{
  "success": true,
  "data": {
    "url": "https://api.example.com/webhook/telegram/<redacted>",
    "pending_update_count": 0,
    "last_error_message": null
  }
}
```

## POST /api/v1/integrations/payment/:provider/test

Test payment provider credentials in sandbox mode.

Supported provider values for MVP:

```txt
midtrans
xendit
manual
```

### Request

```json
{
  "mode": "sandbox"
}
```

### Behavior

- Verify required env/config exists.
- Do not create a real customer charge.
- For Midtrans/Xendit, optionally create a minimal sandbox transaction and immediately expire/cancel it if provider supports it.

### Response

```json
{
  "success": true,
  "data": {
    "provider": "midtrans",
    "mode": "sandbox",
    "reachable": true
  }
}
```

## Error Cases

| Code | Error | Meaning |
|---|---|---|
| 400 | `INVALID_PLATFORM_TYPE` | Platform is not Telegram/expected type |
| 401 | `UNAUTHORIZED` | Missing/invalid JWT |
| 403 | `FORBIDDEN` | User cannot manage integration |
| 404 | `PLATFORM_NOT_FOUND` | Platform not found in workspace |
| 422 | `MISSING_PROVIDER_CONFIG` | Token/key/env missing |
| 502 | `PROVIDER_ERROR` | Telegram/payment provider request failed |

## Security Notes

- Never return raw bot token, app secret, or payment secret key.
- Redact webhook URL secret in logs and API responses.
- Store provider raw response only if it does not contain sensitive token values.
- All integration actions must be workspace-scoped.
