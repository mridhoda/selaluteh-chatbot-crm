# Repository Layer Contract

Migration should not rewrite all routes at once. Add repository interfaces first, then switch implementation route-by-route.

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

1. Create repositories backed by Mongoose.
2. Route code uses repositories only.
3. Create Supabase implementation with same contract.
4. Switch one route group at a time through env flag.
5. Remove direct Mongoose access after full cutover.
