# Repository Layer Contract

Dokumen ini menjelaskan repository layer agar migrasi MongoDB/Mongoose ke Supabase/Postgres bisa dilakukan bertahap.

## Goal

Routes/services jangan langsung bergantung pada Mongoose atau Supabase SDK.

```txt
routes -> services -> repositories -> database implementation
```

Dengan ini implementasi repository bisa diganti tanpa rewrite semua route.

## Recommended Folder

```txt
server/src/repositories/
  users.repository.js
  workspaces.repository.js
  settings.repository.js
  platforms.repository.js
  agents.repository.js
  contacts.repository.js
  chats.repository.js
  messages.repository.js
  files.repository.js
  orders.repository.js
  complaints.repository.js
  products.repository.js
  carts.repository.js
  payments.repository.js
  webhookEvents.repository.js
```

## Base Rules

Every repository method must:

1. accept `workspaceId` when resource is tenant-owned
2. never return cross-workspace data
3. support transaction when needed
4. map camelCase app object to snake_case DB row
5. hide DB-specific API details

## Users Repository

```txt
findByEmail(email)
findById(id)
createOwnerWithWorkspace(input)
setVerified(userId)
setStatus(userId, status)
```

## Platforms Repository

```txt
findById(workspaceId, platformId)
findTelegramByToken(token)
findLatestTelegramWithToken()
findMetaByAccountId(type, accountId)
listByWorkspace(workspaceId)
create(workspaceId, input)
update(workspaceId, platformId, input)
deleteOrDisable(workspaceId, platformId)
```

## Agents Repository

```txt
findByPlatformId(workspaceId, platformId)
findDefaultForWorkspace(workspaceId)
findById(workspaceId, agentId)
listByWorkspace(workspaceId)
createWithChildren(workspaceId, input)
updateWithChildren(workspaceId, agentId, input)
```

## Contacts Repository

```txt
upsertPlatformContact(workspaceId, input)
findByPlatformIdentity(workspaceId, platformType, platformAccountId)
findById(workspaceId, contactId)
updateLastSeen(workspaceId, contactId)
list(workspaceId, filters)
```

## Chats Repository

```txt
findOrCreateForContact(workspaceId, { platformId, contactId, agentId, platformType })
findById(workspaceId, chatId)
listInbox(workspaceId, filters, currentUser)
markRead(workspaceId, chatId)
incrementUnread(workspaceId, chatId)
updateLastMessage(workspaceId, chatId, date)
takeover(workspaceId, chatId, userId)
resolve(workspaceId, chatId)
updateState(workspaceId, chatId, patch)
```

## Messages Repository

```txt
insertMessage(workspaceId, input)
findByChat(workspaceId, chatId, options)
findByPlatformMessageId(workspaceId, chatId, platformMessageId)
existsPlatformMessage(workspaceId, chatId, platformMessageId)
```

## Products Repository

```txt
listProducts(workspaceId, filters)
findProductById(workspaceId, productId)
findProductBySlug(workspaceId, slug)
createProduct(workspaceId, input)
updateProduct(workspaceId, productId, input)
deactivateProduct(workspaceId, productId)
listVariants(workspaceId, productId)
createVariant(workspaceId, productId, input)
updateVariant(workspaceId, variantId, input)
```

## Carts Repository

```txt
findActiveCart(workspaceId, contactId, platformType)
createCart(workspaceId, input)
addOrUpdateItem(workspaceId, cartId, input)
removeItem(workspaceId, cartItemId)
clearCart(workspaceId, cartId)
recalculateTotals(workspaceId, cartId)
getCartWithItems(workspaceId, cartId)
markOrdered(workspaceId, cartId)
```

## Orders Repository

```txt
createOrderFromCart(workspaceId, input, transaction)
findById(workspaceId, orderId)
findByOrderNumber(workspaceId, orderNumber)
listOrders(workspaceId, filters)
updateStatus(workspaceId, orderId, status)
updatePaymentStatus(workspaceId, orderId, paymentStatus)
createLegacyOrderFromAI(workspaceId, input)
```

## Payments Repository

```txt
createPayment(workspaceId, input)
findByProviderOrderId(provider, providerOrderId)
findByProviderTransactionId(provider, transactionId)
updatePaymentStatus(workspaceId, paymentId, status, fields)
insertPaymentEvent(workspaceId, input)
hasProcessedProviderEvent(provider, providerEventId)
```

## Webhook Events Repository

```txt
createReceivedEvent(input)
findByProviderExternalId(provider, externalEventId)
markProcessing(eventId)
markProcessed(eventId)
markIgnored(eventId, reason)
markFailed(eventId, error)
```

## Transaction Requirements

Must use transaction for:

```txt
checkout: create order, create order_items, mark cart ordered
payment webhook: insert payment_event, update payment, update order
```

If Supabase JS transaction is not enough, use Postgres RPC or `pg` transaction.

## Implementation Stages

```txt
Stage 1: repositories wrap Mongoose
Stage 2: DATA_SOURCE=mongo|supabase
Stage 3: route-by-route switch to Supabase
Stage 4: remove Mongoose
```

## Tests

Every repository should test workspace isolation, not found behavior, duplicate prevention, idempotency, and transaction consistency.
