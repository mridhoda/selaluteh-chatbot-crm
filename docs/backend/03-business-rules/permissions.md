# Permissions Rules

## Purpose

Defines role-based permissions for backend actions.

## Roles

```txt
owner
super
agent
```

## Permission Matrix

| Action | Owner | Super | Agent |
|---|---:|---:|---:|
| Login | Yes | Yes | Yes |
| Manage workspace settings | Yes | Partial | No |
| Manage users | Yes | Yes | No |
| Manage platforms | Yes | Yes | No |
| Manage AI agents | Yes | Yes | No |
| View all chats | Yes | Yes | Policy-based |
| Take over chat | Yes | Yes | Yes |
| Send human reply | Yes | Yes | Yes if allowed |
| Resolve chat | Yes | Yes | Yes if assigned |
| Manage products | Yes | Yes | Optional/No |
| Manage orders | Yes | Yes | Limited |
| Update fulfillment status | Yes | Yes | Optional |
| Override payment status | Yes | Optional | No |
| View payments | Yes | Yes | No/Limited |
| Export data | Yes | Yes | No |
| Delete workspace data | Yes | No/Restricted | No |

## Core Rules

### Auth required for admin resources

Admin dashboard APIs must require authenticated JWT/session.

Examples:

```txt
/orders
/complaints
/products
/payments
/platforms
/agents
/chats
```

### Workspace filter required

Auth alone is not enough. Every query must be scoped by `workspace_id`.

### Agent role restrictions

If role is `agent`, backend must apply one of these policies consistently:

Option A — assigned only:

```txt
agent can see only chats where chats.takeover_by = current_user.id
```

Option B — workspace inbox with limited actions:

```txt
agent can view open chats but can only reply after takeover
```

Choose one policy and enforce it across API and UI.

Recommended MVP: Option A for stricter isolation.

## Sensitive Actions

Sensitive actions require owner/super:

- create/update platform token
- create/update payment gateway credentials
- export customer/chat data
- delete messages/orders/payments
- override payment status
- rotate webhook secrets

## Payment Override Rule

Payment status override, if implemented, must require:

```txt
owner role OR super with explicit permission
reason field
audit log entry
no automatic provider webhook contradiction ignored
```

## Human Takeover Permission

A user may take over a chat only if:

- user belongs to same workspace
- chat belongs to same workspace
- chat is not resolved, or reopen is allowed
- user role is owner/super/agent

## Deny by Default

If permission is not explicitly allowed, deny it.

Error should be:

```txt
403 Forbidden
```

not silent filtering, except list endpoints where workspace filtering is expected.
