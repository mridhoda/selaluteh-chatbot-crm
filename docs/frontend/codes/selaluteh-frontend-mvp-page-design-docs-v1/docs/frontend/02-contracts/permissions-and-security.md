# Permissions and Security Contract

## Role assumptions

Existing roles:

```txt
owner
super
agent
```

Frontend may display friendly labels, but must follow backend authority.

## Page-level access

| Page | Owner/Super | Outlet Manager | Human Agent |
|---|---|---|---|
| Products | Full workspace catalog | Assigned outlet scope | Read-only/default |
| Payments | All allowed outlets | Assigned outlets | Relevant chat/order read-only |
| Chat | Workspace/allowed outlets | Assigned outlets | Assigned chats |
| Settings | Workspace-wide | Limited outlet settings | Personal preferences |
| Connected Platforms | Full manage | Read-only by default | Minimal/read-only |

## Frontend authorization rule

Frontend hiding is UX only. Backend must validate every action.

Do not rely on:

```txt
hidden button
route guard only
outlet dropdown limitation
query parameter
```

## Secrets

Never store in local storage:

```txt
bot token
app secret
server key
webhook secret
provider secret
```

Never log these values to console.

## Sensitive actions

Require clear confirmation:

- archive product;
- disconnect platform;
- change payment environment to production;
- reset credentials;
- delete chat;
- destructive settings.

## Payment integrity

- payment webhook is source of truth;
- no manual UI paid transition;
- do not infer paid from image proof in the new gateway flow;
- reconcile only through privileged backend operation with audit trail.

## Tenant/outlet isolation

- always request allowed outlet data;
- handle 403 explicitly;
- never fall back to unscoped data after authorization error;
- clear stale data when workspace/account changes in future.
