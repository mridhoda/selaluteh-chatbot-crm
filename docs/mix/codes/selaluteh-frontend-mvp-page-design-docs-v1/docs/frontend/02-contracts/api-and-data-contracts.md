# API and Data Contracts for the Five Pages

## General rules

- Frontend uses the existing authenticated HTTP client.
- JWT/session handling remains centralized.
- Workspace is derived/validated by backend.
- Outlet filter is treated as requested scope, not trusted authorization.
- All list endpoints support loading, error, pagination, and empty result.
- API errors use one normalized frontend mapper.

Recommended response envelope:

```js
{
  data,
  meta: {
    page,
    limit,
    total,
    totalPages
  }
}
```

Do not require this envelope if existing backend uses another format; adapt in module API layer.

## Products

Frontend methods:

```js
listProducts(params)
getProduct(id)
createProduct(payload)
updateProduct(id, payload)
archiveProduct(id)
updateProductOutletAvailability(productId, outletId, payload)
```

Do not let page components call raw axios/fetch directly.

## Payments

```js
listPayments(params)
getPayment(id)
getPaymentEvents(id)
resendPaymentLink(id)
createOrderPaymentLink(orderId)
```

No frontend method named `markPaid`.

## Chats

```js
listChats(params)
getMessages(chatId)
sendMessage(chatId, payload)
takeOverChat(chatId)
resolveChat(chatId)
reopenChat(chatId) // only if backend supports
```

Preserve idempotency on message retry.

## Settings

```js
getSettings()
updateGeneralSettings(payload)
updateCommerceSettings(payload)
updatePaymentSettings(payload)
updateNotificationSettings(payload)
updateAppearanceSettings(payload)
testPaymentProvider(payload)
```

Secret fields should send a new value only when changed.

## Platforms

```js
listPlatforms()
getPlatform(id)
createPlatform(payload)
updatePlatform(id, payload)
deletePlatform(id)
setTelegramWebhook(id)
testPlatform(id)
getPlatformHealth(id)
```

Unsupported methods should not be mocked as successful.

## Query cache and state

If no data-fetching library is installed, keep module hooks simple and predictable. Do not add a large dependency solely for these pages without approval.

Each hook should expose:

```js
{
  data,
  isLoading,
  error,
  refetch,
  pagination,
  filters,
  setFilters
}
```

Mutation should expose:

```js
{
  mutate,
  isPending,
  error
}
```
