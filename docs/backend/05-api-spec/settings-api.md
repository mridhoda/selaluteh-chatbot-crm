# Settings API

## Purpose

Manage workspace settings such as AI provider preferences and default behavior.

## GET `/api/v1/settings`

Return current workspace settings.

Auth required.

### Response

```json
{
  "success": true,
  "data": {
    "workspace_id": "019...",
    "primary_ai": "openai",
    "secondary_ai": "gemini",
    "default_language": "id",
    "ai_enabled": true,
    "commerce_enabled": true
  }
}
```

## PATCH `/api/v1/settings`

Update workspace settings.

Auth: owner/super.

### Request

```json
{
  "primary_ai": "openai",
  "secondary_ai": "gemini",
  "ai_enabled": true,
  "commerce_enabled": true
}
```

## Rules

- Existing `settings` route must be mounted if frontend depends on it.
- API keys should not be stored in plain settings response.
- Provider credentials should come from secure env or encrypted secrets table.

## Legacy Compatibility

If old frontend calls:

```txt
/settings
```

Map it to:

```txt
/api/v1/settings
```
