# Outlet Access API

## Get User Outlet Access

```http
GET /api/users/:user_id/outlet-access
```

## Update User Outlet Access

```http
PUT /api/users/:user_id/outlet-access
```

Body:

```json
{
  "all_outlets": false,
  "outlets": [
    {
      "outlet_id": "outlet_123",
      "role": "outlet_manager"
    }
  ]
}
```

## Get My Outlet Access

```http
GET /api/me/outlet-access
```

Used by frontend to render outlet selector.

## Rules

- user must be workspace member first
- outlet must belong to workspace
- only owner/admin can assign access
