# Repository Layer Contract

Supabase/Postgres is now the approved runtime target and final end-state. Cutover should still not rewrite all routes at once; freeze repository interfaces first, then switch implementation domain-by-domain.

Approved cutover mode:

```txt
Start fresh from Supabase.
No Mongo backfill.
No dual-write.
No legacy data reconciliation.
Keep custom backend auth.
Use Supabase tests for new repositories/features.
```

## Recommended Folder

```txt
server/src/repositories/
  users.repository.js
  workspaces.repository.js
  platforms.repository.js
  agents.repository.js
  contacts.repository.js
  chats.repository.js
  chatMessages.repository.js      # chat_messages
  files.repository.js
  products.repository.js
  carts.repository.js
  orders.repository.js
  payments.repository.js
  complaints.repository.js
  settings.repository.js          # workspace_settings
  webhookEvents.repository.js
```

## Rule

Every repository method must receive `workspace_id` unless it is truly global.

Bad:

```js
getOrderById(orderId)
```

Good:

```js
getOrderById({ workspaceId, orderId })
```

## Core Contracts

### Contact Upsert

```js
upsertContactByPlatformIdentity({
  workspaceId,
  platformType,
  platformAccountId,
  name,
  handle,
  metadata
})
```

### Chat Upsert

```js
upsertChat({
  workspaceId,
  platformId,
  contactId,
  agentId,
  platformType
})
```

### Message Insert

```js
createMessage({
  workspaceId,
  chatId,
  sender,
  kind,
  text,
  platformMessageId,
  attachmentFileId,
  rawPayload
})
```

### Webhook Idempotency

```js
createWebhookEventIfNew({
  provider,
  externalEventId,
  workspaceId,
  platformId,
  eventType,
  payload
})
```

Returns:

```js
{ created: true, event }
{ created: false, duplicate: true, event }
```

### Product List

```js
listActiveProducts({ workspaceId, categoryId, search, limit, offset })
```

### Active Cart

```js
getOrCreateActiveCart({ workspaceId, contactId, chatId, platformId, platformType })
```

### Checkout

```js
createCheckoutFromCart({ workspaceId, cartId, customerData })
```

### Order Creation

```js
createOrderFromCheckout({ workspaceId, checkoutId })
```

This must snapshot cart items into `order_items`.

### Payment Creation

```js
createPaymentForOrder({ workspaceId, orderId, provider })
```

## Migration Implementation Strategy

1. Complete Supabase foundation: client, env validation, mapping, error mapping, transaction conventions, scope conventions, and test database.
2. Freeze current repository contracts and tests.
3. Seed fresh Supabase dev/test data.
4. Create Supabase implementation with the same contract.
5. Switch one route/service group at a time to Supabase-backed repositories.
6. Remove direct Mongoose access after each group is migrated.
7. Remove Mongo connection, Mongoose models, Mongoose dependency, MongoMemoryServer, `DATA_SOURCE=mongo` fallback, and obsolete Mongo env variables after full cutover.
