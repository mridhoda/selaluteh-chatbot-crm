# Outlet Access Rules

## Access Layers

```txt
workspace membership
→ outlet access
→ action permission
```

## Roles

Workspace-level:

```txt
owner
admin
finance
support_manager
viewer
```

Outlet-level:

```txt
outlet_manager
human_agent
viewer
```

## Rules

Owner/admin:

- can access all outlets in workspace
- can assign users to outlets
- can view all orders/payments/chats

Outlet manager:

- can access assigned outlet(s)
- can process orders for assigned outlet(s)

Human agent:

- can handle assigned outlet chats/orders

## Backend Rule

Never trust frontend outlet_id alone.

Backend must validate:

```txt
authenticated user
workspace membership
outlet belongs to workspace
user has outlet access
role permits action
```

Unauthorized outlet access returns 403 or 404.
