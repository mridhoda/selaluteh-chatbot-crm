---

# FILE: README.md

# 07 UI/UX

Folder ini berisi dokumentasi UI/UX untuk backend **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**.

Catatan penting: karena ini berada di docs backend, fokusnya bukan hanya warna, font, atau tampilan visual. Fokus utamanya adalah:

```txt
UI elements required to operate backend features.
```

Artinya dokumen ini menjelaskan:

- halaman apa yang dibutuhkan admin dashboard
- tombol/action apa saja yang harus ada
- form field apa yang dibutuhkan backend
- data table column apa yang perlu ditampilkan
- state apa yang harus didukung backend/API
- error/loading/empty state apa yang harus ditangani
- komponen apa yang berhubungan dengan product, cart, checkout, payment, webhook, AI, dan chat

## Product Context

Backend ini adalah:

```txt
Existing Chatbot CRM
+ Telegram-first Marketplace MVP
+ Product catalog
+ Cart/checkout/payment
+ AI shopping assistant
+ Human takeover
+ Supabase/Postgres migration path
```

## Recommended Reading Order

1. `backend-ui-contract.md`
2. `pages-list.md`
3. `admin-actions-matrix.md`
4. `components-list.md`
5. `forms-and-fields.md`
6. `data-table-actions.md`
7. `ui-states.md`
8. `telegram-bot-ux.md`
9. `payment-ui-requirements.md`

## Folder Boundary

Put here:

- admin dashboard UI requirements
- page list
- button/action list
- form fields
- table columns/actions
- UX states
- UI component variants
- backend-driven UI needs
- Telegram bot interaction UX

Do not put here:

- API contract detail → `05-api-spec`
- database schema → `06-data`
- security policy → `08-security`
- sprint planning → `11-sprint`
- pure brand marketing → `01-product` or design assets folder


---

# FILE: backend-ui-contract.md

# Backend UI Contract

## Purpose

This document defines what the UI must expose so backend features can be operated safely.

This is not a visual design document. It is a contract between:

```txt
backend capability
↔ dashboard page
↔ UI component
↔ user action
↔ API call
↔ backend state
```

## Core Principle

Every backend state-changing action must have a clear UI representation.

Examples:

| Backend Capability | Required UI |
|---|---|
| Create product | Product form + Save button |
| Archive product | Archive button + confirm dialog |
| View order | Order detail drawer/page |
| Update order status | Status dropdown/button |
| Payment webhook received | Payment event timeline |
| Human takeover | Take Over / Release buttons |
| AI enabled/disabled | Toggle switch |
| Platform webhook setup | Set Webhook button |
| Duplicate webhook ignored | Webhook log status badge |

## MVP UI Priority

### P0 Required

- Login/register.
- Dashboard shell.
- Inbox/chat page.
- Chat detail panel.
- Human takeover button.
- Platforms page.
- Agents page.
- Products page.
- Product form.
- Orders page.
- Order detail.
- Payment status section.
- Settings/API keys section.
- Error/loading/empty states.

### P1 Useful

- Payment events page.
- Webhook logs page.
- Cart/session inspector.
- AI action logs.
- Analytics dashboard.
- Bulk product import.
- File/media manager.

### P2 Later

- Seller dashboard.
- Multi-seller management.
- Voucher management.
- Logistics panel.
- Refund management.
- Review/rating moderation.

## Backend State Visibility Rule

If backend stores important state, admin should be able to inspect it.

Important states:

- chat.status
- chat.takeover_by
- chat.is_escalated
- order.status
- payment.status
- product.status
- platform.enabled
- agent.enabled
- webhook_event.status
- ai_action.status

## Confirmation Rule

Dangerous actions require confirmation:

- delete product
- archive product
- cancel order
- mark order completed manually
- remove platform
- rotate token
- delete chat
- clear cart/session
- disable AI agent
- run migration/import


---

# FILE: pages-list.md

# Pages List

## P0 Admin Pages

```txt
/login
/register
/verify
/app
/app/chats
/app/contacts
/app/platforms
/app/agents
/app/products
/app/products/:id
/app/orders
/app/orders/:id
/app/payments
/app/payments/:id
/app/settings
```

## P1 Admin Pages

```txt
/app/webhook-events
/app/ai-actions
/app/files
/app/analytics
/app/complaints
/app/carts
```

## P2 Future Pages

```txt
/app/sellers
/app/payouts
/app/commissions
/app/refunds
/app/promos
/app/logistics
```

## Page Priority

Build order:

```txt
1. Inbox existing preservation
2. Products
3. Orders
4. Payments
5. Platforms
6. Agents
7. Settings
8. Webhook logs
9. AI action logs
```


---

# FILE: pages-backend-requirements.md

# Pages Backend Requirements

## Purpose

This document defines what each UI page needs from backend.

## Products Page

Needs APIs:

- list products
- create product
- update product
- update status
- delete/archive product
- upload image
- manage variants

Needs UI elements:

- Create Product button
- Search
- Status filter
- Product table
- Edit action
- Archive action

## Orders Page

Needs APIs:

- list orders
- order detail
- update status
- cancel order
- open related chat
- payment summary

Needs UI elements:

- status filter
- payment filter
- date filter
- order table
- order detail drawer
- status update button

## Payments Page

Needs APIs:

- list payments
- payment detail
- payment events
- refresh status
- copy payment link

Needs UI elements:

- payment table
- status badge
- provider reference
- event timeline
- copy link button

## Inbox Page

Needs APIs:

- list chats
- get messages
- send message
- takeover
- resolve
- update contact

Needs UI elements:

- chat list
- chat panel
- composer
- takeover button
- resolve button
- contact panel

## Platforms Page

Needs APIs:

- list platforms
- create/update/delete platform
- set webhook
- test webhook/message

Needs UI elements:

- add platform button
- webhook status
- set webhook button
- token masked input

## Agents Page

Needs APIs:

- list agents
- create/update/delete
- test agent
- upload knowledge
- configure behavior

Needs UI elements:

- prompt editor
- knowledge upload
- test panel
- enable/disable AI toggle


---

# FILE: admin-actions-matrix.md

# Admin Actions Matrix

## Purpose

This document maps admin buttons/actions to backend operations.

## Chat/Inbox Actions

| UI Action | Backend Action | Confirmation? | Notes |
|---|---|---:|---|
| Send Reply | `POST /chats/:id/send` | No | Sends human message |
| Take Over | `POST /chats/:id/takeover` | No | AI stops replying |
| Release Takeover | future endpoint | Yes | AI may resume |
| Resolve Chat | `POST /chats/:id/resolve` | No | Mark as resolved |
| Reopen Chat | future endpoint | No | Set status open |
| Delete Chat | `DELETE /chats/:id` | Yes | Dangerous |
| Add Tag | `PUT /contacts/:id` | No | Updates contact |
| Add Note | `PUT /contacts/:id` | No | Updates contact |
| Escalate to Human | update chat escalation | No | Manual escalation |

## Platform Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| Add Platform | `POST /platforms` | No |
| Update Platform | `PUT /platforms/:id` | No |
| Disable Platform | `PUT /platforms/:id` | Yes |
| Delete Platform | `DELETE /platforms/:id` | Yes |
| Set Telegram Webhook | `POST /integrations/telegram/:id/setWebhook` | Yes |
| Send Test Message | integration/test endpoint | No |
| Verify Webhook | integration/webhook-info endpoint | No |

## Agent Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| Create Agent | `POST /agents` | No |
| Update Agent | `PUT /agents/:id` | No |
| Delete Agent | `DELETE /agents/:id` | Yes |
| Test Agent | `POST /agents/:id/test` | No |
| Upload Knowledge File | `POST /agents/upload` | No |
| Enable/Disable AI | update agent/platform setting | Yes |

## Product Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| Create Product | `POST /products` | No |
| Update Product | `PUT /products/:id` | No |
| Publish Product | `PATCH /products/:id/status` | No |
| Archive Product | `PATCH /products/:id/status` | Yes |
| Delete Product | `DELETE /products/:id` | Yes |
| Add Variant | `POST /products/:id/variants` | No |
| Update Variant | `PUT /variants/:id` | No |
| Upload Product Image | `POST /files` or product image endpoint | No |

## Order Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| View Order | `GET /orders/:id` | No |
| Update Status | `PATCH /orders/:id/status` | Yes if terminal |
| Cancel Order | `POST /orders/:id/cancel` | Yes |
| Mark Completed | `PATCH /orders/:id/status` | Yes |
| Send Order Update | notification endpoint | No |
| Open Related Chat | navigate to chat | No |

## Payment Actions

| UI Action | Backend Action | Confirmation? |
|---|---|---:|
| Create Payment Link | `POST /payments` | No |
| Copy Payment Link | client-side | No |
| Refresh Payment Status | `GET /payments/:id` | No |
| View Events | `GET /payments/:id/events` | No |
| Manual Mark Paid | admin manual endpoint | Yes, high risk |
| Cancel Payment | provider/backend endpoint | Yes |

## Rule

Every destructive or payment-sensitive action must use confirmation modal and show impact summary.


---

# FILE: components-list.md

# Components List

## Purpose

This document lists UI components needed by backend features.

## Layout Components

- AppShell.
- Sidebar.
- Topbar.
- PageHeader.
- Breadcrumbs.
- WorkspaceSwitcher.
- UserMenu.
- NotificationBell.
- StatusBanner.

## Data Display Components

- DataTable.
- DetailDrawer.
- DetailPage.
- Timeline.
- ActivityLog.
- StatusBadge.
- PlatformBadge.
- PaymentStatusBadge.
- OrderStatusBadge.
- ProductStatusBadge.
- UserRoleBadge.
- EmptyState.
- LoadingSkeleton.
- ErrorPanel.

## Form Components

- TextInput.
- TextArea.
- Select.
- MultiSelect.
- Switch.
- Checkbox.
- RadioGroup.
- NumberInput.
- MoneyInput.
- ImageUpload.
- FileUpload.
- TagInput.
- DateRangePicker.
- SearchInput.
- FormSection.
- FormActions.

## Action Components

- PrimaryButton.
- SecondaryButton.
- GhostButton.
- DangerButton.
- IconButton.
- SplitButton.
- CopyButton.
- RefreshButton.
- ConfirmDialog.
- DropdownMenu.
- InlineActionMenu.
- BulkActionBar.

## CRM Components

- ChatList.
- ChatPanel.
- MessageBubble.
- MessageComposer.
- ContactPanel.
- TakeoverButton.
- ResolveChatButton.
- AgentSelector.
- AttachmentPreview.
- ReplyPreview.
- TypingIndicator.

## Marketplace Components

- ProductTable.
- ProductCard.
- ProductForm.
- VariantEditor.
- PriceInput.
- ProductImageManager.
- CartPreview.
- CheckoutSummary.
- OrderTable.
- OrderDetail.
- OrderItemsTable.
- PaymentSummary.
- PaymentEventTimeline.

## Integration Components

- PlatformForm.
- WebhookStatusCard.
- SetWebhookButton.
- TestWebhookButton.
- TokenInputMasked.
- ConnectionStatusBadge.

## AI Components

- AgentPromptEditor.
- KnowledgeList.
- AgentTestPanel.
- AIActionLogTable.
- AIEnabledToggle.
- GuardrailNotice.


---

# FILE: components-backend-contract.md

# Components Backend Contract

## Purpose

This document maps UI components to backend fields and API behavior.

## Status Badge Contract

Component:

```txt
StatusBadge
```

Required props:

- type: order/payment/product/chat/webhook
- status: string
- label override optional

Backend requirement:

- status enums must be stable
- API should return normalized status

## Data Table Contract

Component:

```txt
DataTable
```

Backend requirement:

- pagination
- search
- filters
- sorting
- total count if possible

Minimum query params:

```txt
page
limit
search
status
sort
date_from
date_to
```

## Detail Drawer Contract

Used for:

- order detail
- payment detail
- contact detail
- product quick view
- webhook event detail

Backend requirement:

- detail endpoint returns all needed related summary data
- avoid extra client-side N+1 fetch where possible

## Confirm Dialog Contract

Used for dangerous actions.

Backend requirement:

- action endpoints should be idempotent where possible
- return updated entity after success
- return clear error if action is invalid

## File Upload Contract

Used for:

- product images
- agent knowledge
- chat attachments
- payment proof

Backend requirement:

- file size/type validation
- file metadata returned
- public_path or file_id returned
- workspace scoped storage metadata


---

# FILE: forms-and-fields.md

# Forms and Fields

## Purpose

This document defines key admin forms and fields required for backend features.

## Product Form

Required fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| name | text | Yes | Product display name |
| slug | text | Auto/optional | Unique per workspace |
| description | textarea | No | Used by AI/product detail |
| category_id | select | No | Product category |
| status | select | Yes | draft/active/archived |
| base_price | money | Yes | Minor unit in backend |
| currency | select | Yes | Default IDR |
| image | upload | No | File metadata |
| telegram_visible | switch | Yes | Whether product appears in Telegram |
| sort_order | number | No | Display ordering |

## Variant Form

| Field | Type | Required |
|---|---|---:|
| name | text | Yes |
| sku | text | No |
| price | money | Yes |
| stock_quantity | number | Optional for MVP |
| status | select | Yes |
| attributes | key-value/json | No |

## Platform Form

| Field | Type | Required | Notes |
|---|---|---:|---|
| type | select | Yes | telegram/whatsapp/instagram |
| label | text | Yes | Admin label |
| token | masked secret input | Depends | Telegram token |
| account_id | text | Depends | Meta account id |
| phone_number_id | text | Depends | WhatsApp |
| app_secret | masked secret input | No | Meta security |
| webhook_secret | masked secret input | No | Future webhook security |
| enabled | switch | Yes | Enable/disable platform |

## Agent Form

| Field | Type | Required |
|---|---|---:|
| name | text | Yes |
| platform_id | select | No |
| welcome_message | textarea | No |
| prompt | textarea/code editor | Yes |
| behavior | textarea | No |
| ai_enabled | switch | Yes |
| knowledge files | upload/list | No |
| follow_up rules | repeatable group | No |
| payment instruction | textarea | No for gateway mode |

## Order Status Form

Fields:

- status select
- notes textarea
- notify_customer switch
- reason textarea for cancellation
- confirm checkbox for terminal state

## Payment Manual Action Form

Use only for admin override.

Fields:

- action type
- reason
- proof/reference
- confirm checkbox
- admin password or re-auth for high-risk action

## Validation Rule

Frontend forms should validate basic shape, but backend must always validate again.


---

# FILE: data-table-actions.md

# Data Table Actions

## Purpose

This document defines table columns, filters, and actions needed for backend admin pages.

## Products Table

Columns:

- image
- name
- category
- base price
- status
- telegram visible
- variants count
- updated at
- actions

Filters:

- status
- category
- visibility
- search

Actions:

- view/edit
- publish
- archive
- duplicate
- delete

## Orders Table

Columns:

- order number/id
- customer/contact
- platform
- total amount
- order status
- payment status
- created at
- actions

Filters:

- status
- payment status
- platform
- date range
- customer search

Actions:

- view detail
- open chat
- update status
- cancel order
- send update

## Payments Table

Columns:

- payment id
- order id
- provider
- amount
- status
- provider reference
- created at
- paid at
- actions

Filters:

- status
- provider
- date range
- order id

Actions:

- view event timeline
- copy payment link
- refresh status
- manual action if allowed

## Chats Table/List

Fields:

- contact name
- platform
- last message
- unread
- assigned/takeover
- status
- tags
- last message at

Actions:

- open chat
- takeover
- resolve
- add tag
- delete

## Contacts Table

Columns:

- name
- platform
- handle/account id
- tags
- last seen
- notes
- created at

Actions:

- view
- edit tags
- edit notes
- open chat

## Platforms Table

Columns:

- type
- label
- enabled
- account id
- webhook status
- created at

Actions:

- edit
- set webhook
- test
- disable
- delete

## Webhook Events Table

Columns:

- provider
- event id
- status
- workspace
- related entity
- received at
- processed at
- error

Actions:

- view payload
- retry if safe
- mark ignored if needed


---

# FILE: workflow-buttons.md

# Workflow Buttons

## Purpose

This document defines key workflow buttons required for backend operations.

## Chat Workflow

- Take Over Chat
- Release Takeover
- Send Reply
- Resolve Chat
- Reopen Chat
- Add Tag
- Add Note
- Open Related Order

## Product Workflow

- Create Product
- Save Product
- Publish Product
- Archive Product
- Delete Product
- Add Variant
- Upload Image
- Preview in Telegram

## Cart/Checkout Workflow

Mostly Telegram/customer side, but admin/debug may need:

- View Active Cart
- Clear Cart
- Convert to Checkout
- Expire Checkout

These are P1/debug, not necessarily P0 admin.

## Order Workflow

- View Order
- Update Status
- Cancel Order
- Mark Processing
- Mark Completed
- Send Customer Update
- Open Chat
- View Payment

## Payment Workflow

- Generate Payment Link
- Copy Payment Link
- Refresh Payment Status
- View Events
- Cancel Payment
- Manual Mark Paid

## Platform Workflow

- Add Platform
- Save Platform
- Set Webhook
- Test Connection
- Disable Platform
- Delete Platform

## Agent Workflow

- Create Agent
- Save Agent
- Test Agent
- Upload Knowledge
- Enable AI
- Disable AI

## Dangerous Button Rule

Dangerous buttons:

- require confirmation
- explain impact
- use danger/warning style
- should not be primary CTA


---

# FILE: filters-search-sort.md

# Filters, Search, and Sort

## Purpose

Define filter/search/sort needs so backend can provide proper query support.

## Products

Search:

- name
- sku
- description

Filters:

- status
- category
- visibility
- stock status

Sort:

- created_at
- updated_at
- name
- price
- sort_order

## Orders

Search:

- order id
- customer name
- platform account id

Filters:

- order status
- payment status
- platform
- date range

Sort:

- created_at desc
- updated_at desc
- total amount

## Payments

Search:

- payment id
- provider reference
- order id

Filters:

- provider
- status
- date range

Sort:

- created_at desc
- paid_at desc
- amount

## Chats

Search:

- contact name
- last message
- platform account id

Filters:

- platform
- unread
- assigned/takeover
- status
- tags
- escalated

Sort:

- last_message_at desc

## Webhook Events

Search:

- event id
- provider reference
- related entity id

Filters:

- provider
- status
- date range

Sort:

- received_at desc


---

# FILE: telegram-bot-ux.md

# Telegram Bot UX

## Purpose

Define customer-facing UX for Telegram bot commerce.

## Main Menu

Suggested `/start` menu:

```txt
☕ Lihat Produk
🛒 Keranjang
📦 Status Pesanan
💬 Bantuan Admin
```

## Product List Message

Should show:

- product name
- short description
- price
- availability/status
- buttons to view detail

## Product Detail Message

Should show:

- product name
- description
- price
- variant options if any
- image if available
- Add to Cart button
- Back to Products button

## Cart Message

Should show:

- items
- quantity
- price per item
- subtotal
- total
- buttons:
  - update quantity
  - remove item
  - checkout
  - clear cart

## Checkout Message

Should show:

- customer summary
- order items
- total amount
- payment method/link after confirm
- confirm/cancel buttons

## Payment Message

Should show:

```txt
Ini link pembayaran kamu:
<url>

Setelah pembayaran berhasil, aku akan kabari otomatis di sini ya.
```

## Paid Notification

Example:

```txt
Pembayaran berhasil ✅
Pesanan kamu sedang diproses.
```

## Error Messages

If product unavailable:

```txt
Maaf kak, produk ini sedang tidak tersedia.
```

If cart empty:

```txt
Keranjang kamu masih kosong. Mau lihat produk dulu?
```

If payment pending:

```txt
Pembayaran kamu masih pending. Kalau sudah bayar, tunggu sebentar ya.
```

## UX Rule

Critical actions should use buttons, not free text only.


---

# FILE: payment-ui-requirements.md

# Payment UI Requirements

## Purpose

Define UI elements required to operate payment features safely.

## Payment Status Display

Every order detail should show:

- payment status badge
- provider
- amount
- payment link
- provider reference id
- created at
- paid at
- expires at
- latest webhook event

## Required Buttons

| Button | Purpose | Risk |
|---|---|---|
| Generate Payment Link | create payment | Medium |
| Copy Payment Link | share link | Low |
| Refresh Status | fetch latest state | Low |
| View Events | inspect webhook timeline | Low |
| Cancel Payment | cancel if supported | High |
| Manual Mark Paid | admin override | Critical |

## Manual Mark Paid Rule

This action should be hidden or restricted by default.

If enabled, require:

- owner/super role
- confirmation dialog
- reason text
- proof/reference
- optional re-auth
- audit log

## Payment Event Timeline

Show:

- event type
- provider event id
- signature valid
- status mapped
- processed/failed
- timestamp
- error details if any

## Error States

Common payment errors:

- provider unavailable
- invalid signature
- payment already paid
- payment expired
- order not found
- duplicate event ignored
- amount mismatch

UI must show clear message and recommended action.


---

# FILE: ui-states.md

# UI States

## Purpose

Every backend-driven UI must support states clearly.

## Global States

- loading
- empty
- error
- success
- unauthorized
- forbidden
- not found
- stale data
- saving
- deleting
- retrying

## Table States

### Loading

Show skeleton rows.

### Empty

Show helpful CTA.

Example:

```txt
Belum ada produk. Buat produk pertama untuk mulai menerima order dari Telegram.
```

### Error

Show retry button and error detail.

## Form States

- pristine
- dirty
- validating
- submitting
- success
- error

## Payment States

- creating payment link
- waiting payment
- paid
- failed
- expired
- webhook error
- duplicate webhook ignored

## Telegram States

- bot connected
- webhook not set
- webhook failed
- message received
- callback invalid
- duplicate ignored

## Chat States

- open
- resolved
- escalated
- human takeover
- AI active
- AI disabled

## Empty State CTAs

| Page | Empty State CTA |
|---|---|
| Products | Create Product |
| Orders | Wait for Telegram checkout or create test order |
| Payments | Create payment from order |
| Platforms | Connect Telegram |
| Agents | Create AI Agent |
| Chats | Send test message to bot |


---

# FILE: btn-card-bdg-variants.md

# Button, Card, and Badge Variants

## Button Variants

### Primary Button

Use for main page action.

Examples:

- Create Product
- Save Changes
- Confirm Checkout
- Create Payment Link

### Secondary Button

Use for alternative safe action.

Examples:

- Cancel
- Back
- Preview
- View Details

### Ghost Button

Use for low emphasis actions.

Examples:

- Copy ID
- Open Logs
- View Payload

### Danger Button

Use for destructive actions.

Examples:

- Delete Product
- Cancel Order
- Delete Platform
- Clear Cart

### Warning Button

Use for risky but not destructive actions.

Examples:

- Disable AI
- Archive Product
- Manual Mark Paid

## Card Variants

### Summary Card

Dashboard metrics:

- total orders
- paid orders
- active chats
- payment failures

### Status Card

System status:

- Telegram webhook status
- payment provider status
- AI provider status
- storage status

### Detail Card

Entity details:

- order summary
- payment summary
- customer info
- product info

### Empty Card

No data yet state.

## Badge Variants

### Order Status Badge

Recommended:

- new
- pending_payment
- paid
- processing
- completed
- cancelled

### Payment Status Badge

Recommended:

- pending
- requires_action
- paid
- failed
- expired
- cancelled
- refunded

### Product Status Badge

Recommended:

- draft
- active
- archived
- out_of_stock

### Chat Status Badge

Recommended:

- open
- resolved
- escalated
- human_takeover

### Webhook Status Badge

Recommended:

- received
- processing
- processed
- ignored_duplicate
- failed


---

# FILE: input-txt-slct-tab-nav-variants.md

# Input, Textarea, Select, Tab, and Navigation Variants

## Input Variants

- default input
- search input
- money input
- number input
- masked secret input
- read-only ID input
- copyable input

## Textarea Variants

- default textarea
- notes textarea
- AI prompt editor
- JSON/payload viewer
- error log viewer

## Select Variants

- single select
- multi select
- status select
- platform select
- agent select
- product select
- date range select

## Tabs

Use tabs for entity detail pages.

### Product Detail Tabs

- Overview
- Variants
- Images
- Telegram Visibility
- Activity

### Order Detail Tabs

- Summary
- Items
- Payment
- Chat
- Timeline

### Agent Detail Tabs

- Prompt
- Knowledge
- Sales/Commerce
- Follow-ups
- Test

### Platform Detail Tabs

- Settings
- Webhook
- Test
- Logs

## Navigation

Sidebar groups:

- Dashboard
- Inbox
- Contacts
- Products
- Orders
- Payments
- Platforms
- Agents
- Analytics
- Settings

Future:

- Webhook Logs
- AI Actions
- Files


---

# FILE: design.md

# Design

## Design Goal

The admin dashboard should feel practical, calm, and operational.

This is a tool for managing:

- chats
- products
- orders
- payments
- platforms
- AI agents
- customer issues

## Design Principles

1. Clarity over decoration.
2. State visibility over aesthetics.
3. Safe actions over fast destructive actions.
4. Dense enough for admin operations.
5. Friendly enough for small business owners.
6. Consistent status language.
7. Mobile-aware, but desktop-first for admin.

## Admin Experience

Admin should always know:

- what needs attention
- which orders are unpaid
- which payments failed
- which chats are escalated
- which products are active
- which webhook events failed
- whether AI or human is replying

## Layout Pattern

Recommended:

```txt
Sidebar
Topbar
Page header
Filters/actions
Content table/card
Detail drawer or page
```

## Interaction Pattern

For state-changing action:

```txt
select entity
→ click action
→ validate/confirm if needed
→ backend request
→ show result
→ refresh/update state
```


---

# FILE: design-system.md

# Design System

## Purpose

Define reusable UI rules for admin dashboard.

## Foundations

- Typography.
- Colors.
- Spacing.
- Border radius.
- Shadows.
- Icons.
- Status badges.
- Buttons.
- Inputs.
- Tables.
- Cards.
- Modals.
- Drawers.
- Alerts.

## Backend-Driven Design System

The design system must support backend operations:

- long data tables
- status filtering
- destructive actions
- form validation
- webhook logs
- JSON payload views
- chat messages
- file previews
- payment/order timelines

## Component Categories

### Navigation

- sidebar
- breadcrumbs
- tabs
- page header

### Feedback

- toast
- alert
- error panel
- inline field error
- loading skeleton
- empty state

### Data

- table
- badge
- timeline
- detail drawer
- summary card

### Actions

- button
- dropdown menu
- confirm dialog
- bulk action bar

### Forms

- input
- select
- switch
- upload
- rich text/prompt editor

## Consistency Rule

The same backend status must look the same everywhere.

Example:

```txt
payment.status = paid
```

Should use the same badge style in:

- orders table
- payment table
- order detail
- dashboard metric


---

# FILE: mini-design-system.md

# Mini Design System

## Purpose

A lightweight design system for early MVP.

## Core Components for MVP

P0:

- Button
- Input
- Select
- Textarea
- Switch
- Badge
- Card
- Table
- Modal
- Drawer
- Toast
- EmptyState
- LoadingState
- ErrorState
- FileUpload
- Tabs

## P0 Status Badges

- OrderStatusBadge
- PaymentStatusBadge
- ProductStatusBadge
- ChatStatusBadge
- WebhookStatusBadge

## P0 Pages

- Inbox
- Platforms
- Agents
- Products
- Orders
- Payments
- Settings

## MVP Rule

Do not over-design before core backend flow works.

Prioritize:

```txt
usable admin operations > fancy UI
```


---

# FILE: mini-brand-guideline.md

# Mini Brand Guideline

## Brand Feel

The admin UI should feel:

- reliable
- practical
- friendly
- modern
- clear
- not overly corporate
- not overly playful

## Tone

UI copy should be:

- warm
- direct
- helpful
- action-oriented

Examples:

Good:

```txt
Payment is still pending. Send reminder?
```

Avoid:

```txt
Unknown error.
```

## Admin Copy Style

Use clear action labels:

- Create Product
- Save Changes
- Take Over Chat
- Release Takeover
- Generate Payment Link
- View Payment Events
- Archive Product
- Cancel Order

## Customer-Facing Telegram Copy

Should be warmer:

```txt
Siap kak, produk ini sudah aku tambahkan ke keranjang ☕
```

But backend/admin copy should stay clear and operational.


---

# FILE: ui-component-style.md

# UI Component Style

## Component Style Rules

Admin dashboard components should prioritize:

- readability
- predictable actions
- clear status
- safe destructive flows
- compact but not cramped layout

## Buttons

Use consistent placement:

- Primary action top-right of page header.
- Row actions in kebab/dropdown.
- Destructive action at bottom of detail or confirmation dialog.

## Cards

Use cards for:

- summary metrics
- system status
- detail group
- empty state

## Tables

Tables should support:

- search
- filter
- sort
- pagination/load more
- row action
- status badge

## Detail Drawers

Use detail drawers for fast inspection:

- order detail
- payment detail
- contact detail
- product quick view
- webhook event detail

## Modals

Use modals for:

- confirmation
- small create/edit forms
- high-risk actions
- payment manual override

## Toasts

Use toast for:

- saved successfully
- action failed
- copied link
- webhook set
- payment link created


---

# FILE: darkmode-ui-component-style.md

# Dark Mode UI Component Style

## Purpose

Dark mode should improve long admin sessions without hiding important backend states.

## Dark Mode Requirements

- Status badges remain readable.
- Danger actions remain clearly dangerous.
- Form fields are distinguishable.
- Tables have clear row separation.
- Modals have strong contrast.
- Code/payload viewers are readable.
- Logs and JSON payloads use clear monospace styling.

## Backend Status Priority

Dark mode must clearly show:

- payment paid vs failed
- order pending vs completed
- webhook failed vs processed
- platform enabled vs disabled
- AI enabled vs disabled
- human takeover active

## Components Requiring Special Attention

- Data tables.
- Chat bubbles.
- Message composer.
- JSON payload viewer.
- Payment event timeline.
- Webhook event logs.
- Error panels.
- File upload preview.


---

# FILE: visual-style.md

# Visual Style

## Visual Direction

The dashboard should feel:

```txt
modern, clean, calm, operational, friendly
```

It should not feel too playful because it handles:

- payment
- orders
- customer data
- admin operations
- security-sensitive actions

## Visual Hierarchy

Priority:

1. Critical alerts.
2. Payment/order status.
3. Primary action.
4. Entity details.
5. Metadata.

## Backend State Visibility

Use visual emphasis for:

- unpaid orders
- failed payments
- escalated chats
- disabled platforms
- failed webhooks
- AI errors

## Icons

Use icons to support, not replace, text.

Examples:

- payment status
- webhook event
- platform type
- AI action
- human takeover
- file attachment

## Admin Density

Admin dashboard can be denser than marketing website, but should remain readable.

## Customer Telegram Style

Telegram messages should feel warmer and simpler than admin dashboard copy.


---

# FILE: color-palette.md

# Color Palette

## Purpose

This document defines color usage from a backend UI perspective.

For backend admin, color must communicate state clearly.

## Functional Color Roles

| Role | Purpose |
|---|---|
| Primary | Main action and brand identity |
| Success | Paid, completed, connected |
| Warning | Pending, needs attention, manual review |
| Danger | Failed, cancelled, destructive |
| Info | Neutral system information |
| Muted | Secondary text/background |
| Border | Separation and structure |

## Status Color Mapping

### Payment

| Status | Color Role |
|---|---|
| pending | warning |
| requires_action | warning |
| paid | success |
| failed | danger |
| expired | muted/danger |
| cancelled | muted |
| refunded | info |

### Order

| Status | Color Role |
|---|---|
| new | info |
| pending_payment | warning |
| paid | success |
| processing | info |
| completed | success |
| cancelled | danger |

### Product

| Status | Color Role |
|---|---|
| draft | muted |
| active | success |
| archived | muted |
| out_of_stock | warning |

## Rule

Do not rely on color only.

Always show label text inside badges.


---

# FILE: fontbrand-typography.md

# Font and Typography

## Purpose

Typography must support admin readability.

## Requirements

- Clear table data.
- Readable chat messages.
- Easy scanning of order/payment status.
- Monospace for payload/log/code.
- Strong hierarchy for forms and detail pages.

## Recommended Text Roles

| Role | Usage |
|---|---|
| Display | Dashboard headings |
| Heading | Page titles, modal titles |
| Body | Main content |
| Small | metadata/timestamps |
| Label | form labels |
| Code | webhook payload, tokens, IDs |

## Monospace Usage

Use monospace for:

- webhook event ID
- provider reference ID
- payment ID
- order ID
- JSON payload
- env key
- API path
- error code

## Data Table Typography

Tables should use compact but readable text.

Important values like status and amount should be visually scannable.


---

# FILE: accessibility.md

# Accessibility

## Purpose

Accessibility matters even for admin dashboards because operators may use the system for long sessions.

## Backend-Relevant Accessibility

The UI must make backend states clear without relying only on color.

Examples:

- Payment status should use text + color.
- Order status should use label + icon/color.
- Error states should include messages.
- Disabled buttons should explain why.

## Required Practices

- Buttons have clear labels.
- Icon-only buttons have accessible labels.
- Form fields have labels.
- Required fields are indicated.
- Error messages are tied to fields.
- Keyboard navigation works for forms/tables/dialogs.
- Focus state is visible.
- Confirmation dialogs are keyboard accessible.
- Loading state is announced visually.
- Status badges use text.

## Critical UI Areas

High accessibility priority:

- payment status
- order status
- destructive confirmations
- human takeover
- platform connection status
- error alerts
- file upload errors

## Color Contrast

Status badges and buttons must remain readable in light and dark mode.

## Error Language

Error messages should be actionable:

Bad:

```txt
Error
```

Good:

```txt
Payment webhook signature is invalid. Check provider webhook secret.
```

## Admin Safety

For dangerous actions, require:

- clear title
- impact explanation
- confirmation button text
- cancel button
- focus trap in modal


---

# FILE: responsive-admin-rules.md

# Responsive Admin Rules

## Desktop First

Admin dashboard should be desktop-first because tables, chat inbox, and order operations need space.

## Minimum Responsive Requirements

### Mobile

Must support:

- login
- view dashboard summary
- open chat
- send reply
- take over chat
- view order status

May not fully support:

- complex product editing
- bulk operations
- detailed analytics

### Tablet

Should support:

- inbox
- order list
- product list
- basic forms

## Layout Rules

### Inbox

Desktop:

```txt
Chat list | Chat panel | Contact/order panel
```

Mobile:

```txt
Chat list → Chat panel → Detail panel
```

### Tables

On small screens:

- hide less important columns
- use card list layout
- keep status and primary action visible

### Forms

- stack fields vertically
- keep save button sticky if form is long
