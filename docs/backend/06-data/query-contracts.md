# Query Contracts

## Required Query Context

All tenant queries require:

```txt
workspace_id
```

Outlet-specific queries require:

```txt
outlet_id or allowed_outlet_ids
```

## Orders Query

```txt
findOrders({
  workspaceId,
  allowedOutletIds,
  requestedOutletId,
  filters
})
```

## Products Query

Customer-facing:

```txt
findProductsForOutlet({
  workspaceId,
  outletId,
  activeOnly: true,
  availableOnly: true,
  platformType: "telegram"
})
```

## Payments Query

```txt
findPayments({
  workspaceId,
  allowedOutletIds,
  requestedOutletId
})
```

If requestedOutletId is not allowed, return 403.

For Xendit Test Mode, payment list/detail rows may expose safe fields only:

```txt
provider
environment
status
amount
currency
paymentLinkUrl
expiresAt
attemptNumber
referenceId
```

Never expose provider secret key, webhook verification token, Authorization header, or raw provider response through payment queries.

---

## Frontend MVP Query Contracts

The current frontend needs the following query shapes for MVP pages.

## Outlets Query

Used by Outlets page, filters, Settings default outlet, Orders, and Payments.

```txt
findOutlets({
  workspaceId,
  allowedOutletIds,
  filters: {
    status,
    search
  }
})
```

Rules:

```txt
if user is not workspace owner/admin:
  limit result to allowedOutletIds
```

## Platforms Query

Used by Platforms page and webhook routing.

```txt
findPlatforms({
  workspaceId,
  filters: {
    type,
    status,
    search
  }
})
```

Required return fields:

```txt
id
type
label
status
account_id / bot_id / phone_number_id / page_id
webhook_configured
agent_id
updated_at
```

## Contacts Query

Used by Contacts, Inbox context panel, Orders detail, and Payments detail.

```txt
findContacts({
  workspaceId,
  platformId,
  filters: {
    search,
    tags,
    lastOutletId
  }
})
```

## Chats Query

Used by Inbox and chat context panel.

```txt
findChats({
  workspaceId,
  allowedOutletIds,
  requestedOutletId,
  filters: {
    platformId,
    status,
    aiEnabled,
    takenOverByUserId,
    search
  },
  include: {
    contact: true,
    platform: true,
    currentOutlet: true,
    latestMessage: true
  }
})
```

Rules:

```txt
If requestedOutletId is not allowed, return 403.
If requestedOutletId is empty, limit by allowedOutletIds unless allow_all_outlets_view is true.
```

## Chat Messages Query

```txt
findChatMessages({
  workspaceId,
  chatId,
  cursor,
  limit
})
```

Rules:

```txt
chat.workspace_id must match workspaceId
user must have access to chat.current_outlet_id when current_outlet_id is not null
```

## Product Admin Query

Used by Products page.

```txt
findProducts({
  workspaceId,
  requestedOutletId,
  allowedOutletIds,
  filters: {
    categoryId,
    status,
    stockState,
    search
  },
  include: {
    category: true,
    outletAvailabilitySummary: true,
    salesSummary: true
  }
})
```

Derived fields:

```txt
outlets_count           from product_outlet_availability
sales_month            from order_items + orders
total_sold             from order_items + orders
inventory_summary      from product_outlet_availability
```

## Product Customer Query

Customer-facing Telegram/internal query.

```txt
findProductsForOutlet({
  workspaceId,
  outletId,
  activeOnly: true,
  availableOnly: true,
  platformType: "telegram"
})
```

Rules:

```txt
products.is_active = true
product_outlet_availability.is_available = true when availability row exists
stock_quantity > 0 only when stock_tracking = true
include modifier_groups/options through product_modifier_groups
```

## Product Modifier Admin Query

Used by Products -> Modifiers tab.

```txt
listModifierGroups({ workspaceId })
```

Includes:

```txt
modifier_groups
modifier_options ordered by sort_order
product_modifier_groups with linked product summary
```

Returned UI model:

```txt
id, name, code
type                  # Optional | Required
selectionRule         # Single-select | Multi-select (max N)
minSelection
maxSelection
outletScope
description
tags
options[]             # id, name, price/priceDelta, isActive
productsCount
categoriesCount
requiredInCheckout
status                # Active | Inactive
linkedProducts[]
```

## Order Detail Query

Used by Order Detail drawer.

```txt
findOrderDetail({
  workspaceId,
  orderId,
  allowedOutletIds,
  include: {
    outlet: true,
    contact: true,
    platform: true,
    chat: true,
    items: true,
    events: true,
    payments: true
  }
})
```

Rules:

```txt
order.workspace_id must match workspaceId
order.outlet_id must be in allowedOutletIds unless user has all-outlet access
```

## Payment Detail Query

Used by Payment Detail drawer.

```txt
findPaymentDetail({
  workspaceId,
  paymentId,
  allowedOutletIds,
  include: {
    order: true,
    outlet: true,
    contact: true,
    attempts: true,
    events: true
  }
})
```

Rules:

```txt
payment.workspace_id must match workspaceId
payment.outlet_id must be in allowedOutletIds unless user has all-outlet access
```

## Xendit Session Create Query

Used by authenticated admin/chat commerce flow.

```txt
createXenditPaymentSessionForOrder({
  user,
  workspaceId,
  orderId,
  idempotencyKey
})
```

Rules:

```txt
workspaceId comes from authenticated context
order must belong to workspaceId
user must have access to order.outlet_id
amount and currency come from order only
existing active pending session is reused
paid order rejects new session
idempotencyKey may return prior result for same order/workspace
```

Provider lookup contract:

```txt
findByProviderTransactionId(providerSessionId)
findByMerchantReferenceGlobal(referenceId)
```

Global provider reference lookup is allowed only inside verified webhook processing and must immediately resolve to the internal payment row's workspace/outlet/order scope.

## Workspace Settings Query

Used by Settings page.

```txt
getWorkspaceSettings({
  workspaceId
})
```

```txt
updateWorkspaceSettings({
  workspaceId,
  data: {
    businessDisplayName,
    timezone,
    currency,
    locale,
    supportContactEmail,
    defaultOutletId,
    allowAllOutletsView
  }
})
```

Rules:

```txt
defaultOutletId must belong to workspaceId
only workspace owner/admin can update settings
```

## Payment Provider Settings Query

Used by Settings payment provider form and payment link creation.

```txt
getPaymentProviderSettings({
  workspaceId,
  provider
})
```

```txt
updatePaymentProviderSettings({
  workspaceId,
  provider,
  data: {
    environment,
    merchantId,
    publicKey,
    serverKeyEncrypted,
    webhookSecretEncrypted,
    enabledMethods,
    status
  }
})
```

Rules:

```txt
only workspace owner/admin can update payment provider settings
server_key and webhook_secret must never be returned in plaintext
```

---

## Agent Query

Used by AI Agents list and Agent Detail pages.

```txt
findAgents({
  workspaceId,
  filters: {
    status,
    search
  },
  include: {
    platform: true,
    outlets: true
  }
})
```

```txt
getAgentDetail({
  workspaceId,
  agentId
})
```

Returns:

```txt
id
workspace_id
platform_id
name
behavior
prompt
welcome_message
sticker_url
tools
knowledge
follow_ups
database
complaint_fields
complaint_notification
sales_forms
payment
status
outlets        # from agent_outlets join
created_at
updated_at
```

```txt
updateAgent({
  workspaceId,
  agentId,
  data: {
    name,
    platform_id,
    behavior,
    prompt,
    welcome_message,
    sticker_url,
    tools,
    knowledge,
    follow_ups,
    complaint_fields,
    complaint_notification,
    sales_forms,
    payment,
    status
  }
})
```

```txt
updateAgentOutlets({
  workspaceId,
  agentId,
  outletIds: []
})
```

Rules:

```txt
agent.workspace_id must match workspaceId
only workspace owner/admin can update agent
```

---

## Complaint Query

Used by Complaints list and Complaint Detail drawer.

```txt
findComplaints({
  workspaceId,
  allowedOutletIds,
  requestedOutletId,
  filters: {
    status,
    priority,
    channel,
    assignedToUserId,
    search
  },
  include: {
    outlet: true,
    contact: true,
    chat: true,
    platform: true,
    assignedTo: true
  }
})
```

```txt
getComplaintDetail({
  workspaceId,
  complaintId,
  allowedOutletIds
})
```

Rules:

```txt
complaint.workspace_id must match workspaceId
complaint.outlet_id must be in allowedOutletIds unless user has all-outlet access
```
