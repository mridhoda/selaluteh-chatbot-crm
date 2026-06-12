# Users API

## Purpose

Manage workspace users and human agents.

## Roles

```txt
owner
super
agent
```

## GET `/api/v1/users`

List users in current workspace.

Auth: owner/super.

### Query

| Param | Type | Notes |
|---|---|---|
| `role` | string | optional role filter |
| `status` | string | `online` or `offline` |
| `limit` | number | default 50 |
| `cursor` | string | pagination |

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "019...",
      "workspace_id": "019...",
      "name": "CS Agent",
      "email": "cs@example.com",
      "role": "agent",
      "status": "online",
      "verified": true,
      "created_at": "2026-06-12T00:00:00Z"
    }
  ]
}
```

## POST `/api/v1/users/human`

Create human agent or super user.

Auth: owner/super.

### Request

```json
{
  "name": "Customer Support",
  "email": "cs@example.com",
  "password": "temporary-password",
  "role": "agent"
}
```

### Rules

- Role `owner` cannot be created from this endpoint.
- Email must be unique globally or at least unique by app policy.
- User must be assigned to current workspace.

## PATCH `/api/v1/users/:user_id`

Update workspace user.

Auth: owner/super.

### Request

```json
{
  "name": "Senior CS",
  "role": "super",
  "status": "offline"
}
```

### Rules

- Cannot demote the only owner.
- Cannot move user to another workspace from this endpoint.

## DELETE `/api/v1/users/:user_id`

Delete or deactivate user.

Auth: owner/super.

Recommended behavior: soft-delete/deactivate, not hard-delete, if user has historical chats.

## Deprecated Diagnostic Routes

The old diagnostic routes must not exist in production:

```txt
/users/fix-my-account
/users/find-by-email
```

If kept temporarily, guard them behind admin-only + non-production environment checks.
