# Auth API

## Purpose

Auth API handles owner registration, OTP verification, login, logout, and password reset.

Existing behavior should remain compatible with current custom JWT auth. Supabase Auth can be adopted later using `users.auth_user_id` mapping.

## POST `/api/v1/auth/register`

Create workspace, owner user, and OTP.

### Request

```json
{
  "name": "Rido",
  "email": "owner@example.com",
  "password": "strong-password",
  "workspace_name": "SelaluTeh"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user_id": "019...",
    "workspace_id": "019...",
    "email": "owner@example.com",
    "verified": false
  }
}
```

### Side Effects

Writes:

```txt
workspaces
users
otps
```

Sends/logs OTP email.

## POST `/api/v1/auth/verify`

Verify registration OTP.

### Request

```json
{
  "email": "owner@example.com",
  "code": "123456"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "verified": true
  }
}
```

## POST `/api/v1/auth/login`

Login with verified email/password.

### Request

```json
{
  "email": "owner@example.com",
  "password": "strong-password"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "token": "jwt",
    "user": {
      "id": "019...",
      "workspace_id": "019...",
      "name": "Rido",
      "email": "owner@example.com",
      "role": "owner",
      "plan": "free"
    }
  }
}
```

### Rules

- Email lookup must be case-insensitive.
- `verified = true` is required for login.
- On successful login, set `users.status = online`.

## POST `/api/v1/auth/logout`

Set current user offline.

Auth required.

### Response

```json
{
  "success": true,
  "data": {
    "status": "offline"
  }
}
```

## POST `/api/v1/auth/forgot-password`

Create password reset token.

### Request

```json
{
  "email": "owner@example.com"
}
```

### Response

Always return success to avoid account enumeration:

```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a reset link has been sent."
  }
}
```

## POST `/api/v1/auth/reset-password`

### Request

```json
{
  "token": "reset-token",
  "password": "new-strong-password"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "message": "Password updated."
  }
}
```

## Legacy Route Compatibility

Existing routes can map to v1:

```txt
/auth/register -> /api/v1/auth/register
/auth/verify -> /api/v1/auth/verify
/auth/login -> /api/v1/auth/login
/auth/logout -> /api/v1/auth/logout
/auth/forgot-password -> /api/v1/auth/forgot-password
/auth/reset-password -> /api/v1/auth/reset-password
```
