# Authentication & Authorization

## Authentication Model

Current app uses custom JWT auth with email/password, OTP verification, and roles. Target Supabase/Postgres migration may keep custom JWT initially, with optional future mapping to Supabase Auth.

## App Roles

```txt
owner
super
agent
```

Recommended meaning:

| Role | Permission Summary |
|---|---|
| `owner` | Full workspace admin, billing, users, platforms, agents, products, orders, settings |
| `super` | Workspace operations admin, can manage chats/orders/products depending policy |
| `agent` | Human support agent, can see assigned/taken-over chats and limited customer/order context |

## Core Auth Rules

1. Every protected API must require a valid JWT.
2. Backend must attach current app user from token.
3. Backend must derive `workspace_id` from database user row, not from request body.
4. Sensitive endpoints must check role.
5. User cannot act outside their workspace.
6. Public webhook routes must use provider verification/idempotency, not JWT.

## Route Protection Requirements

| Route Area | Required Auth | Role Requirement |
|---|---|---|
| `/auth/login`, `/auth/register` | Public | N/A |
| `/users` | Yes | owner/super |
| `/platforms` | Yes | owner/super |
| `/agents` | Yes | owner/super |
| `/chats` | Yes | owner/super/agent with restrictions |
| `/contacts` | Yes | owner/super/agent depending rule |
| `/products` | Yes for admin CRUD, optional public bot read internally | owner/super |
| `/carts` | Internal/user session | validated by chat/contact/workspace |
| `/orders` | Yes | workspace scoped |
| `/payments` | Yes for dashboard, webhook public with signature |
| `/complaints` | Yes | workspace scoped |
| `/files` / `/media` | Depends | workspace checked for private media |

## Agent Role Restrictions

Human agent should not automatically see all workspace data unless product decision says so.

Recommended default:

```txt
agent can see:
  chats where takeover_by = current_user.id
  chats explicitly assigned to them
  minimal contact profile for assigned chat
  orders related to assigned chat/customer

agent cannot:
  manage users
  manage payment settings
  see platform tokens
  see all workspace chats by default
```

## Authorization Implementation Pattern

```js
const user = await usersRepo.findById(jwt.id)
const workspaceId = user.workspace_id

const order = await ordersRepo.findByIdForWorkspace(orderId, workspaceId)
if (!order) throw notFound()

requireRole(user, ['owner', 'super'])
```

Avoid:

```js
// unsafe
const { workspace_id } = req.body
await db.orders.find({ workspace_id })
```

## Critical Fixes Before Production

- `orders` routes must require auth.
- `complaints` routes must require auth.
- Diagnostic user routes must be removed or protected.
- Admin-only settings/routes must not be accessible to `agent` unless intended.
