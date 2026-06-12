# Platforms API

## Purpose

Manage connected external messaging platforms:

```txt
telegram
whatsapp
instagram
facebook
custom
```

## GET `/api/v1/platforms`

List connected platforms for current workspace.

Auth required.

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "019...",
      "type": "telegram",
      "label": "Main Telegram Bot",
      "account_id": "bot_username_or_chat_ref",
      "enabled": true,
      "webhook_status": "configured",
      "created_at": "2026-06-12T00:00:00Z"
    }
  ]
}
```

Sensitive fields such as `token`, `app_secret`, and `webhook_secret` must not be returned by default.

## GET `/api/v1/platforms/:platform_id`

Return safe platform detail.

Auth required.

## POST `/api/v1/platforms`

Create platform connection.

Auth: owner/super.

### Telegram Request

```json
{
  "type": "telegram",
  "label": "SelaluTeh Telegram Bot",
  "token": "<telegram_bot_token>",
  "enabled": true
}
```

### Meta Request

```json
{
  "type": "whatsapp",
  "label": "SelaluTeh WhatsApp",
  "token": "<meta_page_or_system_token>",
  "account_id": "meta_account_id",
  "phone_number_id": "meta_phone_number_id",
  "app_id": "meta_app_id",
  "app_secret": "<meta_app_secret>",
  "webhook_secret": "<optional>"
}
```

## PATCH `/api/v1/platforms/:platform_id`

Update platform config.

Auth: owner/super.

### Request

```json
{
  "label": "Updated Label",
  "enabled": true
}
```

Token update should be explicit:

```json
{
  "token": "<new_token>",
  "rotate_token": true
}
```

## DELETE `/api/v1/platforms/:platform_id`

Auth: owner/super.

Recommended behavior: soft-disable if platform has existing chats.

## POST `/api/v1/platforms/:platform_id/set-webhook`

Configure provider webhook.

Auth: owner/super.

### Telegram Response

```json
{
  "success": true,
  "data": {
    "provider": "telegram",
    "webhook_url": "https://api.example.com/webhook/telegram/<secret>",
    "configured": true
  }
}
```

## Security Rules

- Store tokens encrypted if possible.
- Never return raw token after creation.
- Webhook route should use a secret token/path where provider supports it.
- Platform lookup for webhook must include `workspace_id` through platform row.
