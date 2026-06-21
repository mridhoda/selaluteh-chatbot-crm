# All Frontend MVP Page Design Docs


---

# FILE: 00-foundation/design-alignment.md

# Design Alignment

## 1. Visual direction

Semua halaman harus terasa sebagai bagian dari dashboard yang sama dengan Orders page dan sidebar Selalu Teh saat ini.

Gunakan:

- background aplikasi sangat terang / soft neutral;
- surface putih untuk card, table, drawer, dan modal;
- text utama navy gelap;
- accent utama mengikuti token brand pink yang sudah ada;
- section label/sidebar menggunakan token purple yang sudah ada;
- success menggunakan semantic green;
- warning menggunakan amber;
- danger menggunakan red;
- info atau ready state dapat menggunakan blue;
- border tipis, shadow lembut, radius konsisten;
- ikon outline sederhana dan konsisten.

**Jangan menambahkan color system baru.** Gunakan CSS variables atau token yang sudah ada pada project/docs. Jika token belum tersedia, buat semantic tokens, bukan hard-coded warna di setiap component.

Contoh semantic token:

```css
--color-brand-primary
--color-brand-primary-soft
--color-text-primary
--color-text-secondary
--color-border-default
--color-surface-page
--color-surface-card
--color-success
--color-warning
--color-danger
--color-info
```

## 2. Page shell

Semua halaman utama memakai shell berikut:

```txt
Page header
├── title
├── concise description
├── primary/secondary actions
└── optional last-updated state

Filter/search toolbar
Optional active-filter chips (only when non-default filters exist)
Optional summary cards
Main content table/list/canvas
Pagination or infinite-load control
Right detail drawer or modal
```

### Header rule

- Title jelas dan pendek.
- Subtitle menjelaskan scope workspace/outlet.
- Primary action diletakkan kanan.
- Jangan menggunakan lebih dari satu filled primary action pada satu header.

### Active filter rule

Jangan tampilkan banner seperti `Showing: All Outlets · Today` ketika filter masih default.

Tampilkan active-filter strip hanya ketika ada filter non-default:

```txt
Active filters: Selkop Samarinda ×  Pending Payment ×  Today ×  Clear all
```

## 3. Layout density

Desktop dashboard harus cukup padat untuk operasional, namun tidak cramped.

- page content horizontal padding: mengikuti Orders page;
- card gap konsisten;
- table row cukup tinggi untuk dua baris metadata;
- drawer width cukup untuk detail tanpa menutupi seluruh table;
- gunakan whitespace untuk grouping, bukan banyak divider berat.

## 4. Reusable interaction patterns

Gunakan pola yang sama di kelima halaman:

- filter dropdown;
- search input;
- status badge;
- active-filter chips;
- data table;
- detail drawer;
- confirmation dialog;
- toast feedback;
- skeleton loading;
- empty state;
- inline error with retry;
- permissions-based disabled/hidden action.

## 5. Accessibility

- Semua field memiliki visible label atau `aria-label` yang jelas.
- Jangan mengandalkan warna saja untuk status.
- Semua status badge punya text.
- Focus ring harus terlihat.
- Modal/drawer menangkap focus dan mengembalikannya saat ditutup.
- Icon-only button memiliki tooltip dan accessible label.
- Target klik minimum 40px untuk action penting.
- Table harus tetap dapat dipahami pada zoom 200%.

## 6. Responsive behavior

### Desktop >= 1280px

- full sidebar;
- filters satu baris bila muat;
- table penuh;
- right detail drawer.

### Tablet 768–1279px

- sidebar collapsible;
- filters wrap menjadi 2 baris;
- summary cards horizontal scroll atau 2–3 kolom;
- table horizontal scroll;
- drawer lebih lebar secara proporsional.

### Mobile < 768px

- gunakan stacked cards/list untuk table-heavy pages;
- filters masuk filter sheet;
- detail drawer menjadi full-screen sheet;
- chat menjadi single-pane navigation: list → conversation → context;
- jangan mencoba memampatkan desktop table ke layar kecil.


---

# FILE: 00-foundation/multi-outlet-and-workspace-context.md

# Multi-Outlet and Workspace Context

## Architecture decision

```txt
MVP:
1 workspace/account Selalu Teh
└── many outlets

Future:
many workspaces/accounts/franchise owners
└── many outlets per workspace
```

## Core rule

```txt
workspace_id = pemilik/account bisnis/franchise owner
outlet_id    = cabang operasional
```

Frontend tidak boleh mencampur keduanya.

## Global state

Gunakan state global yang sudah disiapkan:

```txt
web/src/stores/workspaceStore.js
web/src/stores/outletStore.js
```

State minimum:

```js
{
  currentWorkspace,
  availableWorkspaces,
  currentOutlet,
  availableOutlets,
  outletAccessMode: 'all' | 'restricted' | 'single'
}
```

## All Outlets behavior

`All Outlets` hanya tersedia ketika user memiliki akses ke lebih dari satu outlet dan role-nya mengizinkan aggregate view.

### Owner / Super Admin

- dapat memilih `All Outlets`;
- dapat melihat aggregate metrics;
- dapat mengubah outlet filter;
- dapat membuat product workspace-level dan mengatur availability per outlet.

### Outlet Manager / Human Agent terbatas

- hanya melihat outlet yang diizinkan;
- jika akses hanya satu outlet, selector disembunyikan atau locked;
- query tetap mengirim outlet context yang diizinkan;
- UI tidak boleh menyediakan cara untuk mengakses outlet lain hanya dengan mengubah URL/query param.

## Page behavior

### Products

- `All Outlets` berarti catalog workspace + availability across outlets.
- Outlet spesifik berarti tampilkan availability, price override, dan stock/availability outlet tersebut.

### Payments

- `All Outlets` berarti aggregate transaction view.
- Outlet spesifik memfilter payment berdasarkan order outlet.

### Chat

- chat harus menyimpan platform dan outlet context.
- chat tanpa outlet context harus diberi label `Outlet not selected` atau `Unassigned`.
- active order/cart menentukan outlet context yang tidak boleh berubah diam-diam.

### Settings

- workspace settings berbeda dari outlet settings.
- gunakan tab/subsection yang eksplisit.

### Connected Platforms

- platform secara default workspace-level.
- outlet routing dapat dikonfigurasi terpisah jika diperlukan.
- jangan menganggap satu token Telegram sama dengan satu outlet kecuali business rule memang memutuskan begitu.


---

# FILE: 00-foundation/shared-page-components.md

# Shared Page Components

## Recommended shared components

```txt
web/src/shared/components/ui/PageHeader.jsx
web/src/shared/components/ui/FilterBar.jsx
web/src/shared/components/ui/ActiveFilterChips.jsx
web/src/shared/components/ui/DataTable.jsx
web/src/shared/components/ui/DetailDrawer.jsx
web/src/shared/components/ui/StatusBadge.jsx
web/src/shared/components/ui/SearchInput.jsx
web/src/shared/components/ui/ConfirmDialog.jsx
web/src/shared/components/ui/EmptyState.jsx
web/src/shared/components/ui/ErrorState.jsx
web/src/shared/components/ui/Skeleton.jsx
web/src/shared/components/feedback/Toast.jsx
```

Tidak harus membuat semua component dalam satu task. Extract hanya ketika minimal dua module benar-benar memakai pola yang sama.

## Page header props

```js
{
  title,
  description,
  primaryAction,
  secondaryActions,
  lastUpdated,
  isRefreshing,
  onRefresh
}
```

## Filter bar contract

```js
{
  outletId,
  dateRange,
  status,
  channel,
  search,
  extraFilters,
  onChange,
  onClearAll
}
```

Default filter tidak dihitung sebagai active filter.

## Status badge

Badge harus menerima semantic status, bukan warna mentah:

```js
<StatusBadge domain="payment" status="paid" />
<StatusBadge domain="order" status="preparing" />
<StatusBadge domain="platform" status="connected" />
```

Mapping warna ditempatkan terpusat.

## Detail drawer

Drawer dipakai untuk quick operational inspection tanpa kehilangan table context.

Drawer harus memiliki:

- title + identifier;
- status badge;
- metadata utama;
- grouped sections;
- sticky footer untuk action utama jika perlu;
- close button;
- loading, error, and not-found state;
- URL/deep-link optional, tetapi jangan wajib untuk MVP.

## Confirmation rule

Gunakan confirmation dialog untuk:

- archive product;
- disconnect/delete platform;
- cancel payment link bila didukung;
- delete conversation;
- reset destructive settings;
- actions yang memengaruhi outlet/workspace lain.

Tidak perlu confirmation untuk:

- filter change;
- opening drawer;
- copying ID/link;
- non-destructive refresh;
- simple tab switch.


---

# FILE: 01-pages/chat-center-page.md

# Chat Center Page Design Specification

## 1. Purpose

Chat Center mempertahankan kekuatan CRM lama: inbox multi-channel, AI assistant, human takeover, contact context, dan direct reply. Untuk marketplace MVP, Chat Center juga harus menampilkan outlet, active cart/order, dan payment context.

## 2. Route and module

```txt
Route: /app/chats or existing /app route compatibility
Page: web/src/modules/chats/pages/ChatCenterPage.jsx
API: web/src/modules/chats/api/chatsApi.js
Components: web/src/modules/chats/components/*
```

Preserve existing route behavior until migration is complete.

## 3. Desktop layout

Use a three-pane operational layout:

```txt
Chat list | Conversation | Context panel
```

Recommended width behavior:

- chat list: 300–360px;
- conversation: flexible main area;
- context panel: 320–380px;
- context panel can collapse.

## 4. Chat list pane

### Header

```txt
Chat
Search
Filter button
```

### Filters

```txt
Outlet
Channel
Assignment
Status
Unread only
Escalated
Date range
Tags
```

Filter values:

- All allowed outlets;
- Telegram, WhatsApp, Instagram;
- Assigned to me, Unassigned, AI handling, Human takeover;
- Open, Resolved;
- Unread;
- Escalated.

### Chat row

Show:

- contact avatar/initial;
- contact name/handle;
- platform icon;
- outlet name or `Outlet not selected`;
- last message preview;
- timestamp;
- unread badge;
- assignment/takeover indicator;
- optional order/payment status badge when relevant.

Sort default:

```txt
last_message_at descending
```

## 5. Conversation pane

### Header

Show:

```txt
Contact name
Channel
Outlet context
AI / Human handling status
Assigned agent
```

Actions:

- Take Over / Return to AI, based on permission;
- Resolve / Reopen;
- More actions;
- optional call/open channel action if supported.

### Message timeline

Support existing behavior:

- user messages;
- AI messages;
- human messages;
- system events;
- attachments;
- reply-to preview;
- date separators;
- delivery/sending/error state where provider supports it.

System events examples:

```txt
AI started handling
Rido took over this conversation
Outlet selected: Selkop Samarinda
Order #ORD-1028 created
Payment link sent
Payment received
Conversation resolved
```

### Composer

Features:

- multiline text;
- send;
- attachment if existing backend supports;
- reply-to;
- optional canned response/P1;
- disable with clear reason if channel disconnected;
- disable when user lacks access.

Do not let AI and human send simultaneously without visible handling state.

## 6. Context panel

Use tabs or sections, not an overloaded single scroll.

Recommended sections:

### Contact

```txt
Name
Phone/handle
Channel identity
Tags
Notes
First/last contact
```

### Commerce

```txt
Selected outlet
Active cart
Latest order
Payment status
```

Actions:

- View cart — only if backend supports session/cart inspect;
- Open order;
- Copy/resend payment link when valid;
- Change outlet only before cart/order lock and with explicit confirmation.

### AI and assignment

```txt
Assigned AI agent
Human takeover user
Escalation reason
Conversation status
```

### History

- recent orders;
- complaints;
- optional previous conversations.

## 7. Outlet context rules

- A chat may begin without outlet selection.
- Once customer selects outlet, show it prominently.
- A cart belongs to one outlet.
- If active cart/order exists, changing outlet must not happen silently.
- Opening a chat does not globally change admin outlet selector unless explicitly chosen.
- Admin may view chat outlet context even when page global filter is `All Outlets`.

## 8. Human takeover states

### AI handling

- `Take Over` action available to authorized human.
- AI status visible.

### Human takeover

- display assigned human;
- AI must stop sending;
- composer enabled for assigned/authorized human;
- other agents may be read-only depending on policy.

### Escalated

- prominent but non-alarming indicator;
- reason if available;
- quick take-over action.

### Resolved

- composer disabled or requires Reopen;
- preserve full message history.

## 9. Existing API contracts to preserve

```http
GET  /chats
GET  /chats/:chatId/messages
POST /chats/:chatId/send
POST /chats/:chatId/takeover
POST /chats/:chatId/resolve
DELETE /chats/:chatId
```

List query should support:

```txt
unreadOnly
agentId
assignment
date range
tags
search
status
outletId
channel
```

Messages must be ordered ascending and workspace validated.

## 10. Polling and refresh

Current app uses polling. Preserve behavior during MVP refactor.

Rules:

- prevent overlapping requests;
- retain selected chat;
- do not jump scroll while user reads history;
- append new messages safely;
- show reconnect/error state;
- future WebSocket/SSE upgrade is optional, not part of this design task.

## 11. Empty/loading/error states

### No conversations

```txt
No conversations yet
New customer conversations will appear here after a connected channel receives a message.
[Open Connected Platforms]
```

### No selection

```txt
Select a conversation to start
```

### Channel disconnected

Show banner with `Open Connected Platforms` action.

### Send failure

- failed bubble state;
- retry where safe;
- do not duplicate message on retry.

## 12. Permissions

- Owner/Super: all workspace chats and allowed outlets.
- Human agent: assigned/allowed chats according to existing role contract.
- Outlet-restricted user: only chats belonging to assigned outlets, plus unassigned chats only when policy allows assignment.
- Delete chat should be privileged and confirmed.

## 13. Required components

```txt
ChatCenterPage.jsx
ChatList.jsx
ChatListItem.jsx
ChatFilters.jsx
ChatPanel.jsx
ChatHeader.jsx
MessageTimeline.jsx
MessageBubble.jsx
SystemEventMessage.jsx
MessageComposer.jsx
TakeoverButton.jsx
ChatContextPanel.jsx
ChatCommerceContext.jsx
ContactPanel.jsx
QuickActions.jsx
```

## 14. Acceptance criteria

- Existing chat, messages, reply-to, takeover, resolve, and send still work.
- Outlet and channel context are visible.
- Active order/payment can be opened from context panel.
- AI stops on takeover.
- Unread count and sorting remain correct.
- Polling does not create duplicate messages.
- Unauthorized outlet chats are not shown.
- Mobile switches cleanly between list, conversation, and context.


---

# FILE: 01-pages/connected-platforms-page.md

# Connected Platforms Page Design Specification

## 1. Purpose

Connected Platforms mengelola channel komunikasi yang menghubungkan customer ke CRM dan marketplace.

Current channel foundation:

- Telegram webhook exists and is the MVP commerce channel.
- WhatsApp/Instagram Meta webhook foundation exists.
- Platform CRUD exists.
- Telegram setWebhook endpoint exists.

The page must accurately reflect capability status. Do not label a channel `Ready for Commerce` merely because credentials are saved.

## 2. Route and module

```txt
Route: /app/platforms
Page: web/src/modules/platforms/pages/PlatformsPage.jsx
API: web/src/modules/platforms/api/platformsApi.js
Components: web/src/modules/platforms/components/*
```

## 3. Header

```txt
Connected Platforms
Connect and monitor the channels used by your customers
```

Primary action:

```txt
Connect Platform
```

Optional secondary:

```txt
Webhook Diagnostics
```

Only show diagnostics if implemented and permission-appropriate.

## 4. Overview status cards

Maximum four:

1. Connected Channels
2. Active
3. Needs Attention
4. Messages Today

Do not use cards if backend cannot provide reliable values.

## 5. Main platform list

Use cards or table. For current dashboard, a table is more scalable; platform type cards may be used in the connect modal.

Recommended columns:

```txt
Platform
Connection
Assigned AI Agent
Outlet Scope / Routing
Last Activity
Webhook Health
Actions
```

### Platform cell

```txt
Telegram
@selaluteh_bot
```

or:

```txt
WhatsApp
+62 ...
```

### Connection status

Semantic states:

```txt
Connected
Disabled
Pending Setup
Needs Attention
Disconnected
```

### Webhook health

Separate from connection status:

```txt
Healthy
No Recent Events
Verification Failed
Delivery Errors
Not Configured
```

## 6. Platform detail drawer

### Header

- icon/type;
- label/account;
- connection badge;
- enable/disable toggle where safe.

### Sections

#### A. Account details

```txt
Platform type
Display label
Bot username / phone number
Account ID
Connected since
Last activity
```

#### B. Agent assignment

```txt
Assigned AI agent
Fallback behavior
Human takeover availability
```

#### C. Outlet routing

MVP default:

```txt
Workspace-wide channel
Customer selects outlet during commerce flow
```

Optional routing:

- default outlet;
- allowed outlets;
- dedicated channel per outlet, only if business needs it.

Do not force platform-to-one-outlet mapping by default.

#### D. Webhook status

```txt
Webhook URL
Last successful event
Last failed event
Verification status
Recent safe error message
```

#### E. Commerce capability

Explicit capability checklist:

```txt
Receive messages
Send messages
Inline buttons/product browse
Cart flow
Checkout flow
Payment-link delivery
Order notification
```

This prevents misleading `Connected` status.

## 7. Connect platform modal

Step 1 — select platform:

```txt
Telegram
WhatsApp
Instagram
```

Mark Telegram as recommended for current MVP.

Step 2 — credentials/configuration.

### Telegram fields

```txt
Display label
Bot token
Optional default AI agent
Optional default outlet
```

After save:

- call backend setWebhook action;
- show result;
- run test connection if supported;
- never display full token again.

### WhatsApp fields

```txt
Display label
WhatsApp Business Account ID
Phone Number ID
App ID
App Secret
Access Token
Webhook Verify Token/Secret
```

Only request fields backend truly supports. Keep secrets write-only.

### Instagram fields

Use current Meta integration contract. Do not invent completed OAuth flow if backend only has placeholder support.

## 8. Platform actions

### Safe actions

- View details
- Test connection
- Refresh webhook status
- Enable/disable
- Reassign AI agent
- Copy webhook URL

### Destructive actions

- Disconnect
- Delete configuration

Require confirmation. Explain impact:

```txt
Incoming messages may stop.
Existing chats and history will not be deleted.
```

## 9. Telegram-specific MVP UX

The Telegram card/detail should show:

```txt
Bot identity
Webhook configured
Bot can receive messages
Bot can send messages
Marketplace flow readiness
Last callback query
```

Marketplace readiness is not only webhook health. It also depends on:

- product catalog available;
- outlet selection flow enabled;
- cart/checkout endpoint ready;
- payment provider configured.

Display readiness checklist instead of one vague badge.

## 10. Error and diagnostics behavior

Common errors:

- invalid bot token;
- webhook URL unavailable;
- setWebhook failed;
- Meta verification failed;
- token expired;
- permission scope missing;
- sender API failed;
- duplicate platform account.

UI should show:

- concise human-readable error;
- timestamp;
- Retry/Test action;
- expandable technical code for admin;
- no raw secret or full payload.

## 11. Permissions and security

- Owner/Super: connect, edit, disable, disconnect.
- Outlet Manager: read status if relevant; no credentials by default.
- Human Agent: read channel status only if needed.
- Tokens/secrets are masked and write-only.
- Frontend logs must not contain token values.
- Webhook URL can be visible; secret verification value cannot.
- Backend validates workspace ownership on every platform action.

## 12. Existing API contracts

Current baseline:

```http
GET    /platforms
GET    /platforms/:id
POST   /platforms
PUT    /platforms/:id
DELETE /platforms/:id
POST   /integrations/telegram/:id/setWebhook
```

Recommended additions when backend supports them:

```http
POST /platforms/:id/test
GET  /platforms/:id/health
GET  /platforms/:id/capabilities
POST /platforms/:id/enable
POST /platforms/:id/disable
```

Do not silently simulate health in frontend.

## 13. Empty/loading states

### No platform

```txt
No channels connected
Connect Telegram to start receiving marketplace conversations.
[Connect Telegram]
```

### Connected but inactive

Show configuration saved separately from runtime health.

### Partial provider outage

Keep list usable and show a top-level non-blocking incident banner if known.

## 14. Required components

```txt
PlatformsPage.jsx
PlatformsSummaryCards.jsx
PlatformsTable.jsx
PlatformStatusBadge.jsx
WebhookHealthBadge.jsx
PlatformDetailDrawer.jsx
PlatformPickerModal.jsx
ConnectPlatformWizard.jsx
TelegramConnectionForm.jsx
MetaConnectionForm.jsx
PlatformCapabilitiesChecklist.jsx
PlatformWebhookPanel.jsx
PlatformDangerZone.jsx
TestConnectionResult.jsx
```

## 15. Acceptance criteria

- Telegram can be configured without exposing token after save.
- Connection status and webhook health are separate.
- Marketplace readiness shows explicit checklist.
- Existing platform CRUD remains functional.
- Disconnect requires confirmation.
- Outlet routing is clear and not hardwired incorrectly.
- Unsupported provider features are labeled honestly.
- Errors are useful but do not expose secrets.


---

# FILE: 01-pages/payments-page.md

# Payments Page Design Specification

## 1. Purpose

Payments adalah operational transaction page untuk melihat hubungan antara order, payment link, provider event, dan final payment status.

Payment page tidak boleh menjadi tempat admin mengubah transaksi menjadi `paid` secara manual. Payment gateway webhook atau verified backend reconciliation adalah source of truth.

## 2. Route and module

```txt
Route: /app/payments
Page: web/src/modules/payments/pages/PaymentsPage.jsx
API: web/src/modules/payments/api/paymentsApi.js
Components: web/src/modules/payments/components/*
```

## 3. Header

```txt
Payments
Monitor payment links and transactions across all outlets
```

Right actions:

- `Export` — only when supported;
- Refresh icon + last updated;
- no `Create Payment` global button for normal use.

Payment links should originate from order checkout, not arbitrary standalone creation.

## 4. Filter toolbar

```txt
Outlet
Date Range
Payment Status
Provider / Method
Channel
Search
```

Payment status options:

```txt
Pending
Paid
Expired
Failed
Cancelled
Refunded (read-only/P1 unless refund is implemented)
```

Search by:

- payment ID;
- order ID;
- customer name/phone;
- provider reference.

## 5. Summary cards

Recommended maximum five:

1. Total Collected
2. Pending
3. Paid Transactions
4. Failed / Expired
5. Needs Attention

`Needs Attention` examples:

- provider status mismatch;
- payment paid but order not updated;
- duplicate webhook event;
- payment link creation failed;
- webhook signature rejected;
- payment pending beyond expected time.

Metrics must follow selected date and outlet context.

## 6. Main table

Recommended columns:

```txt
Payment ID
Order
Customer
Outlet
Channel
Provider / Method
Amount
Payment Status
Created At
Actions
```

Optional columns through column selector:

```txt
Provider Reference
Expires At
Last Event
Updated At
```

### Payment ID cell

- internal short ID;
- provider reference secondary text;
- warning icon for mismatch/attention.

### Order cell

- clickable order ID;
- order status secondary text.

### Provider/method

Examples:

```txt
Midtrans · QRIS
Xendit · E-Wallet
Cash on Delivery
Manual Transfer (legacy only)
```

Do not imply provider integration exists until implemented.

### Row actions

- View details
- Open order
- Open chat
- Copy payment link
- Resend payment link
- Regenerate link only when backend explicitly supports safe regeneration

Never provide `Mark as Paid` in production UI.

## 7. Payment detail drawer

Header:

```txt
Payment #PAY-...
[status badge]
Order #ORD-...
```

Sections:

### A. Payment summary

```txt
Amount
Provider
Method
Status
Created at
Expires at
Paid at
Provider reference
```

### B. Customer and outlet

```txt
Customer name
Contact
Channel
Outlet
```

### C. Related order

```txt
Order ID
Order status
Order total
Items count
[Open Order]
```

### D. Payment link

- masked/shortened display;
- Copy link;
- Resend to customer;
- expiration indicator;
- do not expose secret callback data.

### E. Event timeline

Events ordered ascending or descending consistently:

```txt
Payment created
Link generated
Customer opened link (only if provider supports)
Webhook received
Signature verified
Provider status mapped
Order marked paid
Notification sent
```

Each event shows:

- timestamp;
- event type;
- result;
- retry count if relevant;
- provider event ID;
- safe error summary.

Do not render raw secrets or full sensitive payload.

### F. Diagnostics

Visible only to privileged roles:

- idempotency key;
- webhook verification status;
- last synchronization;
- safe provider response summary.

## 8. Status behavior

### Pending

Actions:

- copy/resend link;
- open chat;
- cancel only if provider/backend supports it.

### Paid

Actions:

- open order;
- open chat;
- view events.

No destructive mutation.

### Expired

Actions:

- regenerate payment link through order flow if supported;
- never silently reuse expired link.

### Failed

Actions:

- inspect event;
- retry link creation if failure occurred before customer payment;
- escalate to support when provider state is unclear.

## 9. Empty/loading/error states

### No payments yet

```txt
No payment transactions yet
Payments will appear after a customer confirms checkout.
```

### Gateway not configured

```txt
Payment gateway is not configured
Configure a sandbox provider in Settings before enabling checkout payments.
[Open Payment Settings]
```

### Error

Keep filters and show Retry. Do not reset user context.

## 10. Permissions and security

- Owner/Super Admin: all allowed outlets.
- Outlet Manager: payments related to assigned outlets only.
- Human Agent: read payment summary for chats/orders they can access; resend link only when permitted.
- Provider credentials are never displayed in this page.
- Sensitive webhook payload is redacted.
- Frontend must not infer paid state from customer screenshot or chat message.

## 11. API expectations

Suggested list query:

```http
GET /payments?outlet_id=&status=&provider=&channel=&date_from=&date_to=&search=&page=&limit=
```

Suggested detail:

```http
GET /payments/:id
GET /payments/:id/events
```

Operational actions:

```http
POST /payments/:id/resend-link
POST /orders/:orderId/payment-link
POST /payments/:id/reconcile   # privileged, optional
```

There must be no general endpoint such as:

```http
PATCH /payments/:id { status: "paid" }
```

## 12. Required components

```txt
PaymentsPage.jsx
PaymentsToolbar.jsx
PaymentsSummaryCards.jsx
PaymentsTable.jsx
PaymentStatusBadge.jsx
PaymentDetailDrawer.jsx
PaymentSummarySection.jsx
PaymentEventTimeline.jsx
PaymentLinkActions.jsx
PaymentAttentionBadge.jsx
```

## 13. Acceptance criteria

- Payment and order statuses remain separate.
- No manual mark-paid action exists.
- Outlet filter restricts results correctly.
- Payment detail shows event timeline.
- Resend/copy link only appears when valid.
- Expired/failed states have explicit recovery guidance.
- Sensitive values are masked/redacted.
- Page supports loading, empty, error, and unauthorized states.


---

# FILE: 01-pages/products-page.md

# Products Page Design Specification

## 1. Purpose

Products adalah source of truth admin untuk catalog yang dipakai oleh Telegram marketplace dan channel lain di masa depan.

Page ini harus mendukung:

- product CRUD;
- category and status management;
- product image;
- base price;
- simple variant/modifier support;
- availability per outlet;
- optional outlet price override;
- simple stock/availability indicator;
- audit-friendly operational view.

MVP tidak mencakup complex inventory reservation, supplier management, purchase order, voucher, bundle engine, atau warehouse management.

## 2. Route and module

```txt
Route: /app/products
Page: web/src/modules/products/pages/ProductsPage.jsx
API: web/src/modules/products/api/productsApi.js
Components: web/src/modules/products/components/*
Hooks: web/src/modules/products/hooks/*
Styles: web/src/modules/products/styles/*
```

## 3. Header

### Left

```txt
Products
Manage the catalog and availability across your outlets
```

### Right actions

- Secondary: `Import` — optional, disabled/hidden until backend supports it.
- Primary: `Add Product`.

Do not show a non-functional import action as active.

## 4. Filter toolbar

Order:

```txt
Outlet
Category
Product Status
Availability
Search
```

Recommended values:

### Outlet

- All Outlets
- each allowed outlet

### Product status

- All Statuses
- Active
- Draft
- Archived

### Availability

- All Availability
- Available
- Unavailable
- Out of Stock
- Partial Outlet Availability

### Search

Search by:

- product name;
- SKU;
- category;
- optional variant name.

Active-filter chips appear only for non-default selections.

## 5. Summary cards

Use maximum four cards. Cards must respond to current outlet and filters.

Recommended:

1. Total Products
2. Active
3. Unavailable / Out of Stock
4. Needs Attention

`Needs Attention` includes:

- missing image;
- no active outlet availability;
- invalid/zero price if not allowed;
- archived category with active product;
- incomplete required field.

Cards may be hidden at narrow widths or when they do not provide value.

## 6. Main table

Recommended columns:

```txt
Product
Category
Availability / Outlets
Base Price
Variants
Status
Updated At
Actions
```

### Product cell

- 40–48px image thumbnail;
- product name;
- SKU/short ID secondary text;
- optional issue badge.

### Availability cell

When `All Outlets`:

```txt
3 of 4 outlets
Partial
```

When specific outlet:

```txt
Available
Rp2.000 override
```

### Status

Product lifecycle status is separate from availability.

Examples:

```txt
Active + Available
Active + Unavailable at selected outlet
Draft
Archived
```

### Row actions

- View/Edit
- Duplicate — optional P1
- Set availability
- Archive
- Restore when archived

Do not expose hard delete as the normal action. Archive is safer for products referenced by historical orders.

## 7. Product create/edit experience

Use a large right drawer or dedicated full page if the form grows. For MVP, a wide drawer is acceptable.

### Section A — Basic information

Fields:

```txt
Product name *
Description
Category *
SKU / product code
Product image
Status: Draft | Active
```

### Section B — Pricing

```txt
Base price *
Compare-at price (optional, hide for MVP if unused)
Tax behavior (optional, follow backend rules)
```

Use Indonesian Rupiah formatting in display, but store numeric minor/major units consistently with backend contract.

### Section C — Variants and modifiers

MVP recommendation:

- simple variants only if required by menu;
- examples: Size, Ice Level, Sugar Level;
- modifier option can add price;
- enforce unique combinations if true variants are used.

Do not build a generic unlimited option engine if current Telegram flow only needs a few deterministic options.

### Section D — Outlet availability

Provide a table/matrix:

```txt
Outlet | Available | Price Override | Stock/Availability | Notes
```

Rules:

- workspace-level base product always exists once;
- outlet availability is separate;
- price override is optional;
- disabling an outlet does not delete the product;
- existing paid/historical orders must keep snapshot data.

### Section E — Channel preview

Optional but valuable:

- Telegram product card preview;
- image, name, price, short description;
- preview is read-only;
- do not let preview diverge from actual saved product fields.

## 8. Product detail drawer

Sections:

1. Product overview
2. Price and variants
3. Outlet availability
4. Channel visibility
5. Recent updates
6. Related orders — optional P1

Primary action: `Edit Product`.

## 9. States

### Empty catalog

```txt
No products yet
Add your first product to start building the Telegram catalog.
[Add Product]
```

### Empty filter result

```txt
No products match these filters
[Clear filters]
```

### Loading

- summary skeletons;
- table rows skeleton;
- keep toolbar interactive only when safe.

### Error

- inline error with Retry;
- retain current filter state.

## 10. Permissions

### Owner / Super Admin

- create, update, archive;
- manage all outlet availability;
- view all outlets.

### Outlet Manager

- view products available to assigned outlet;
- optionally edit availability/stock for own outlet only;
- cannot edit workspace base product or other outlet price unless permission allows.

### Human Agent

- read-only product lookup by default.

## 11. Backend/data contract expectations

Minimum product shape:

```js
{
  id,
  workspaceId,
  name,
  description,
  sku,
  imageUrl,
  category,
  basePrice,
  status,
  variants,
  outletAvailability,
  createdAt,
  updatedAt
}
```

Outlet availability shape:

```js
{
  outletId,
  outletName,
  isAvailable,
  priceOverride,
  stockQuantity,
  availabilityStatus
}
```

Backend must derive/validate workspace. UI must not send arbitrary workspace ownership.

## 12. Required components

```txt
ProductsPage.jsx
ProductsToolbar.jsx
ProductsSummaryCards.jsx
ProductsTable.jsx
ProductStatusBadge.jsx
ProductFormDrawer.jsx
ProductBasicFields.jsx
ProductPricingFields.jsx
ProductVariantsEditor.jsx
ProductOutletAvailabilityEditor.jsx
ProductDetailDrawer.jsx
ProductImageUploader.jsx
```

Only extract components when the page is becoming difficult to maintain. Avoid empty abstraction files.

## 13. Acceptance criteria

- Product list loads and is outlet-aware.
- Search and filters can combine.
- Default filters do not show active-filter banner.
- Create/edit validation is clear.
- Product status and outlet availability are visually distinct.
- Historical orders are not affected by later product edits.
- User cannot modify unauthorized outlet availability.
- Build and lint have no errors.


---

# FILE: 01-pages/settings-page.md

# Settings Page Design Specification

## 1. Purpose

Settings mengelola configuration yang berlaku pada workspace dan outlet. Page ini tidak boleh menjadi tempat duplikasi seluruh configuration dari Connected Platforms atau AI Agents.

## 2. Route and module

```txt
Route: /app/settings
Page: web/src/modules/settings/pages/SettingsPage.jsx
API: web/src/modules/settings/api/settingsApi.js
```

Current backend note: settings route exists in legacy project but previously reported as not mounted. AI agent must verify current runtime before wiring UI.

## 3. Layout

Use settings navigation on the left and content panel on the right for desktop.

Recommended sections:

```txt
General
Commerce
Orders & Checkout
Payments
Notifications
AI Providers
Security
Appearance
Danger Zone
```

For MVP, sections may be grouped to reduce complexity:

```txt
General
Commerce
Payments
Notifications
Security
Appearance
```

Connected channel credentials belong to Connected Platforms, not Settings.

## 4. General settings

### Workspace profile

```txt
Workspace name
Business display name
Timezone
Currency
Locale
Support contact
```

### Multi-outlet default

```txt
Default outlet for admin view
Allow All Outlets aggregate view
Default date range
```

Changing default outlet affects initial UI context, not stored order outlet.

## 5. Commerce settings

```txt
Catalog enabled
Default product availability behavior
Allow out-of-stock display
Default preparation estimate
Order auto-accept behavior (optional)
Customer order prefix
```

Avoid settings that contradict backend business rules.

## 6. Orders & checkout settings

Recommended MVP fields:

```txt
Require outlet selection before cart
Allow order notes
Allow cash on delivery (only if business enables it)
Payment link expiry
Order cancellation window
Customer confirmation message
Paid notification message
```

Text templates must have safe variables and preview.

Example supported variables:

```txt
{{customer_name}}
{{order_id}}
{{outlet_name}}
{{total_amount}}
{{payment_link}}
```

Do not allow arbitrary code or unsafe template execution.

## 7. Payment settings

### Provider configuration

```txt
Provider: None | Midtrans | Xendit
Environment: Sandbox | Production
Merchant/account identifier
Public/client key where applicable
Secret/server key
Webhook secret
Default payment methods
```

Security rules:

- secrets are write-only;
- existing secrets display as masked configured state;
- frontend never receives full secret again;
- production switch requires explicit confirmation;
- test connection button uses backend endpoint;
- display webhook URL as copyable, non-secret value;
- show last test result and timestamp.

### Payment behavior

```txt
Default link expiration
Auto-send payment link after checkout
Notify customer on paid/expired/failed
```

## 8. Notification settings

```txt
New order
Payment received
Payment failed/expired
Order needs attention
New escalated chat
Platform disconnected
Webhook failure
```

Delivery destinations may include:

- in-app;
- email;
- Telegram internal/admin destination, only if supported.

Avoid building a complex notification routing engine in MVP.

## 9. AI provider settings

Current settings model already contains primary and secondary AI provider concepts.

Fields:

```txt
Primary AI
Secondary AI fallback
Provider configured status
Test provider
```

Do not expose API keys returned from backend. AI agent-specific behavior remains in AI Agents page.

## 10. Security settings

```txt
Session/security summary
Require re-authentication for sensitive actions
Webhook security status
Audit log link (P1)
```

Do not put user password/profile forms here if Profile page already owns them.

## 11. Appearance

```txt
Theme: Light | Dark | System
Sidebar default state
Table density: Comfortable | Compact
```

Appearance is user preference, not workspace business logic, unless explicitly designed otherwise.

## 12. Danger zone

MVP:

- disconnect all test/sandbox integrations — optional;
- reset non-critical UI preferences;
- workspace deletion should be hidden unless backend lifecycle is fully implemented.

Any destructive action requires confirmation and explicit consequence text.

## 13. Save behavior

Prefer section-level save rather than one massive page save.

Rules:

- track dirty state;
- show `Save changes` only when changed;
- disable while saving;
- success toast;
- inline field errors;
- warn before navigating away with unsaved changes;
- optimistic update only for low-risk preferences;
- secrets use explicit submit and backend confirmation.

## 14. Permission model

### Owner / Super Admin

- workspace and payment settings;
- notification defaults;
- security settings.

### Outlet Manager

- outlet-specific operational settings only, when such subsection exists;
- no payment provider secrets;
- no workspace-wide configuration.

### Human Agent

- own appearance/preferences only.

## 15. Settings data separation

Do not create one uncontrolled JSON blob if backend already has structured fields.

Recommended conceptual separation:

```txt
workspace settings
commerce settings
payment provider configuration
notification preferences
user appearance preferences
```

Secrets should be stored in environment/secrets manager or encrypted backend storage, not plain frontend state.

## 16. Required components

```txt
SettingsPage.jsx
SettingsNavigation.jsx
SettingsSection.jsx
GeneralSettingsForm.jsx
CommerceSettingsForm.jsx
CheckoutSettingsForm.jsx
PaymentProviderSettingsForm.jsx
NotificationSettingsForm.jsx
AIProviderSettingsForm.jsx
SecuritySettingsPanel.jsx
AppearanceSettingsForm.jsx
DangerZonePanel.jsx
SecretField.jsx
TestConnectionResult.jsx
```

## 17. Acceptance criteria

- Settings are clearly separated from Connected Platforms and AI Agents.
- Workspace/outlet scope is explicit.
- Secrets never display in full.
- Section save state works correctly.
- Unauthorized sections are hidden or read-only.
- Unsaved changes warning works.
- Payment sandbox can be tested without exposing credentials.
- Settings API failure does not discard entered values silently.


---

# FILE: 02-contracts/api-and-data-contracts.md

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


---

# FILE: 02-contracts/permissions-and-security.md

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


---

# FILE: 02-contracts/status-and-label-matrix.md

# Status and Label Matrix

## Product lifecycle

| Status | Meaning | Semantic style |
|---|---|---|
| draft | Not visible to customer | neutral |
| active | Eligible for channel display | success/info |
| archived | Hidden, retained for history | neutral |

## Product outlet availability

| Status | Meaning |
|---|---|
| available | Can be ordered in outlet |
| unavailable | Manually disabled for outlet |
| out_of_stock | Temporarily unavailable |
| partial | Available in some outlets |

## Payment

| Status | Meaning |
|---|---|
| pending | Awaiting customer/provider result |
| paid | Verified payment success |
| expired | Link/payment window expired |
| failed | Provider/process failed |
| cancelled | Cancelled safely |
| refunded | Provider verified refund, P1/read-only until supported |

## Chat

| Status | Meaning |
|---|---|
| open | Active conversation |
| resolved | Closed operationally |
| escalated | Needs human attention |

Handling state is separate:

```txt
ai_handling
human_takeover
unassigned
```

## Platform connection

```txt
connected
disabled
pending_setup
needs_attention
disconnected
```

Webhook health is separate:

```txt
healthy
no_recent_events
verification_failed
delivery_errors
not_configured
```

## Rule

Never reuse one generic `status` badge mapping for different domains without a domain key. `pending` payment and `pending setup` platform are not the same state.


---

# FILE: 02-contracts/ui-state-contract.md

# UI State Contract

Each page must explicitly support:

```txt
initial loading
background refresh
success with data
empty resource
empty filtered result
partial data
recoverable error
unauthorized
not found
offline/disconnected dependency
mutation pending
mutation success
mutation failure
```

## Loading

- skeleton over spinner for page/table;
- do not flash empty state before loading resolves;
- retain old data during safe background refresh.

## Error

- concise explanation;
- Retry action;
- preserve filters/form input;
- do not expose raw stack trace.

## Unauthorized

```txt
You do not have access to this outlet or action.
```

Do not silently show empty data for access denied.

## Mutation feedback

- disable duplicate submission;
- show progress state;
- show success toast;
- restore form interaction on failure;
- avoid optimistic updates for payment/security/platform credential operations.

## Last updated

Show only when meaningful. Refresh icon must expose loading state and be accessible.


---

# FILE: 03-implementation/delivery-plan.md

# Delivery Plan

## Phase 0 — Read and audit

- Read backend docs listed in README.
- Inspect current module implementations and routes.
- Confirm current build and lint baseline.
- Confirm existing API response shapes.
- Do not change backend contracts by assumption.

## Phase 1 — Shared UI behavior

- PageHeader pattern.
- Filter bar and active chips.
- Status badges with domain mapping.
- Drawer/modal states.
- Loading/empty/error patterns.

Do not redesign Orders page during this task unless shared extraction requires a safe, visual-equivalent change.

## Phase 2 — Connected Platforms

Reason: existing API and UI already exist.

- migrate/refine current platform UI;
- add honest connection/webhook/capability state;
- preserve Telegram setWebhook flow;
- mask secrets.

## Phase 3 — Chat Center

Reason: existing functionality is critical and already available.

- preserve current behavior;
- add outlet/order/payment context progressively;
- keep polling stable;
- do not break takeover.

## Phase 4 — Products

- implement catalog page and form against real API when available;
- if API is not ready, use a clearly isolated mock adapter only for visual development;
- no fake persistence presented as production-ready.

## Phase 5 — Settings

- mount/verify backend route first;
- implement section-level forms;
- payment provider configuration in sandbox mode;
- secrets write-only.

## Phase 6 — Payments

- implement after payment data model and gateway endpoints exist;
- list, detail, event timeline, link actions;
- no manual paid action.

## Phase 7 — Hardening

- role/outlet access checks;
- responsive states;
- accessibility;
- loading/error/empty states;
- build/lint/tests.

## Scope guard

Do not add in this delivery:

```txt
multi-seller
voucher engine
complex inventory reservation
shipping provider
refund automation
loyalty
public storefront
```


---

# FILE: 03-implementation/frontend-module-map.md

# Frontend Module Map

## Products

```txt
web/src/modules/products/
├─ api/productsApi.js
├─ components/
├─ hooks/
├─ pages/ProductsPage.jsx
├─ styles/
└─ utils/
```

## Payments

```txt
web/src/modules/payments/
├─ api/paymentsApi.js
├─ components/
├─ hooks/
├─ pages/PaymentsPage.jsx
├─ styles/
└─ utils/
```

## Chats

Preserve existing working components and incrementally reorganize:

```txt
web/src/modules/chats/
├─ api/chatsApi.js
├─ components/
├─ hooks/
├─ pages/ChatCenterPage.jsx
├─ styles/
└─ utils/
```

## Settings

```txt
web/src/modules/settings/
├─ api/settingsApi.js
├─ components/
├─ hooks/
├─ pages/SettingsPage.jsx
├─ styles/
└─ utils/
```

## Platforms

```txt
web/src/modules/platforms/
├─ api/platformsApi.js
├─ components/
├─ hooks/
├─ pages/PlatformsPage.jsx
├─ styles/
└─ utils/
```

## Shared extraction rule

A component remains inside module unless:

- used by at least two modules;
- domain-neutral;
- stable enough to have a reusable API.

Do not create shared abstraction prematurely.

## Import rule

- page imports module components;
- module components may import shared UI;
- shared must not import from feature modules;
- modules should not deeply import internals from other modules;
- cross-module navigation uses route/link and shared contracts.


---

# FILE: 03-implementation/navigation-and-routes.md

# Navigation and Routes

Recommended MVP navigation:

```txt
COMMERCE
Dashboard
Orders
Products
Outlets
Payments

CRM
Chat
Contacts
Connected Platforms
AI Agents
Human Agents
Complaints

OPERATIONS / INSIGHTS
Analytics
Reports
Billing

SETTINGS
Settings
Profile
```

## Routes

```txt
/app/products
/app/payments
/app/chats
/app/settings
/app/platforms
```

Keep aliases/legacy compatibility only when necessary during migration.

## Navigation visibility

- Payments may be hidden behind feature flag until API is ready, or shown with clear setup state.
- Unsupported routes must not lead to blank pages.
- Permission-restricted items may be hidden or read-only based on product decision.
- Sidebar labels must stay consistent with page titles.


---

# FILE: 04-testing/acceptance-test-plan.md

# Frontend Acceptance Test Plan

## Global

- [ ] All five routes render inside existing dashboard layout.
- [ ] Sidebar active state is correct.
- [ ] Workspace/outlet context is preserved.
- [ ] Default filters do not render redundant active-filter strip.
- [ ] Non-default filters render removable chips.
- [ ] Loading, empty, filtered-empty, error, and unauthorized states exist.
- [ ] Drawers/modals are keyboard accessible.
- [ ] Build passes.
- [ ] Lint has no errors.

## Products

- [ ] Owner can open Add Product.
- [ ] Required field validation works.
- [ ] Product status differs from outlet availability.
- [ ] Outlet availability matrix respects permissions.
- [ ] Archive confirmation appears.
- [ ] Search and filters combine correctly.

## Payments

- [ ] Payment list is outlet/date/status aware.
- [ ] Detail drawer shows order and event timeline.
- [ ] No manual mark-paid control exists.
- [ ] Link actions only appear in valid states.
- [ ] Secret/provider payload values are redacted.

## Chat

- [ ] Existing list/messages/send work.
- [ ] Unread resets as intended.
- [ ] Human takeover stops AI.
- [ ] Resolve/reopen behavior is correct.
- [ ] Outlet/order/payment context is visible.
- [ ] Polling does not duplicate messages.

## Settings

- [ ] Section-level dirty/save state works.
- [ ] Unsaved changes warning works.
- [ ] Secret field stays masked and write-only.
- [ ] Permission-restricted sections are protected.
- [ ] Provider test shows timestamp/result.

## Connected Platforms

- [ ] List and detail load.
- [ ] Connection and webhook health are separate.
- [ ] Telegram setup does not reveal token after save.
- [ ] Test/setWebhook feedback is clear.
- [ ] Disconnect requires confirmation.
- [ ] Unsupported capabilities are not shown as complete.


---

# FILE: 04-testing/responsive-and-accessibility-checklist.md

# Responsive and Accessibility Checklist

## Responsive

- [ ] Desktop 1440px layout matches dashboard density.
- [ ] 1280px keeps core columns usable.
- [ ] Tablet filters wrap without overlap.
- [ ] Table has intentional horizontal behavior.
- [ ] Mobile uses cards/sheets, not compressed desktop table.
- [ ] Chat mobile flow works list → conversation → context.
- [ ] Drawer becomes full-screen sheet on mobile.

## Accessibility

- [ ] All inputs have labels.
- [ ] Icon buttons have accessible names.
- [ ] Focus order is logical.
- [ ] Focus is trapped in modal/drawer.
- [ ] Status is not color-only.
- [ ] Contrast follows existing design standard.
- [ ] Error text is linked to fields.
- [ ] Keyboard can use filters, tables, menus, and dialogs.
- [ ] Live regions announce save/send result where appropriate.


---

# FILE: README.md

# Selalu Teh Marketplace — Frontend MVP Page Design Docs

Dokumen ini adalah spesifikasi desain dan implementasi frontend untuk lima halaman prioritas MVP:

1. Products
2. Payments
3. Chat Center
4. Settings
5. Connected Platforms

Dokumen dibuat untuk aplikasi gabungan **CRM + Telegram-first Marketplace + multi-outlet**, dengan kesiapan arsitektur untuk future multi-workspace/franchise owner.

## Target frontend

```txt
web/src/modules/products
web/src/modules/payments
web/src/modules/chats
web/src/modules/settings
web/src/modules/platforms
```

## Prinsip utama

- Jangan membuat ulang aplikasi dari nol.
- Gunakan struktur frontend feature-based yang sudah ada.
- Pertahankan visual language dan komponen yang sudah dipakai oleh Orders page.
- Backend tetap menjadi source of truth untuk catalog, cart, checkout, order, payment, chat, dan platform status.
- Telegram adalah channel commerce MVP pertama.
- WhatsApp dan Instagram dapat tetap terlihat sebagai channel lain, tetapi jangan menganggap semuanya sudah memiliki commerce flow yang setara.
- Semua query operasional harus workspace-scoped dan outlet-aware.
- Jangan mempercayai `workspace_id` atau `outlet_id` dari UI tanpa validasi backend.

## Dokumen yang harus dibaca AI agent

Urutan minimum:

```txt
docs/backend/index.md
docs/backend/READING-ORDER.md
docs/backend/00-overview/scope.md
docs/backend/00-overview/target-state.md
docs/backend/03-business-rules/workspace-tenant-rules.md
docs/backend/03-business-rules/outlet-rules.md
docs/backend/03-business-rules/outlet-access-rules.md
docs/backend/03-business-rules/product-catalog-rules.md
docs/backend/03-business-rules/payment-rules.md
docs/backend/03-business-rules/human-takeover-rules.md
docs/backend/05-api-spec/products-api.md
docs/backend/05-api-spec/payments-api.md
docs/backend/05-api-spec/chats-api.md
docs/backend/05-api-spec/platforms-api.md
docs/backend/05-api-spec/settings-api.md
docs/backend/06-data/database-schema.md
docs/backend/06-data/query-contracts.md
docs/backend/07-uiux/design-system.md
docs/backend/07-uiux/outlet-selector-pattern.md
docs/backend/07-uiux/ui-states.md
docs/backend/08-security/workspace-tenant-security.md
docs/backend/08-security/outlet-access-security.md
docs/backend/08-security/payment-security.md
docs/backend/08-security/webhook-security.md
docs/backend/09-ai-context/do-not-break.md
```

## Paket ini

```txt
00-foundation/       Shared design and page behavior
01-pages/            Detailed page specifications
02-contracts/        UI data, API, state, permission contracts
03-implementation/   Frontend module and delivery plan
04-testing/          Acceptance and QA requirements
ai-handoff/          Prompt ready for coding agent
```


---

# FILE: ai-handoff/MASTER_IMPLEMENTATION_PROMPT.md

# Master Implementation Prompt — Five MVP Pages

You are working inside the `selaluteh-chatbot-crm` repository.

Your task is to implement/refine the frontend designs for:

1. Products
2. Payments
3. Chat Center
4. Settings
5. Connected Platforms

## Mandatory reading before code

Read these docs first:

```txt
docs/backend/index.md
docs/backend/READING-ORDER.md
docs/backend/00-overview/scope.md
docs/backend/00-overview/target-state.md
docs/backend/03-business-rules/workspace-tenant-rules.md
docs/backend/03-business-rules/outlet-rules.md
docs/backend/03-business-rules/outlet-access-rules.md
docs/backend/03-business-rules/product-catalog-rules.md
docs/backend/03-business-rules/payment-rules.md
docs/backend/03-business-rules/human-takeover-rules.md
docs/backend/05-api-spec/products-api.md
docs/backend/05-api-spec/payments-api.md
docs/backend/05-api-spec/chats-api.md
docs/backend/05-api-spec/platforms-api.md
docs/backend/05-api-spec/settings-api.md
docs/backend/06-data/database-schema.md
docs/backend/06-data/query-contracts.md
docs/backend/07-uiux/design-system.md
docs/backend/07-uiux/outlet-selector-pattern.md
docs/backend/07-uiux/ui-states.md
docs/backend/08-security/workspace-tenant-security.md
docs/backend/08-security/outlet-access-security.md
docs/backend/08-security/payment-security.md
docs/backend/08-security/webhook-security.md
docs/backend/09-ai-context/do-not-break.md

docs/frontend/README.md
docs/frontend/00-foundation/design-alignment.md
docs/frontend/00-foundation/multi-outlet-and-workspace-context.md
docs/frontend/01-pages/products-page.md
docs/frontend/01-pages/payments-page.md
docs/frontend/01-pages/chat-center-page.md
docs/frontend/01-pages/settings-page.md
docs/frontend/01-pages/connected-platforms-page.md
docs/frontend/02-contracts/api-and-data-contracts.md
docs/frontend/02-contracts/permissions-and-security.md
docs/frontend/04-testing/acceptance-test-plan.md
```

## Current architecture

Frontend is React + Vite and already uses feature modules:

```txt
web/src/modules/products
web/src/modules/payments
web/src/modules/chats
web/src/modules/settings
web/src/modules/platforms
```

MVP architecture:

```txt
one workspace/account
└── multiple outlets
```

Future architecture:

```txt
multiple workspace/accounts/franchise owners
└── multiple outlets each
```

## Critical rules

- Do not rebuild the application.
- Do not redesign the sidebar or Orders page.
- Reuse the current Selalu Teh design language and existing tokens.
- Do not introduce a new color palette.
- Keep backend as source of truth.
- Telegram is the first commerce channel.
- Do not implement fake production persistence.
- Do not show unsupported capabilities as complete.
- Do not create a manual `Mark as Paid` action.
- Do not expose bot tokens, payment keys, app secrets, or webhook secrets.
- Preserve existing Chat behavior: messages, polling, reply-to, takeover, resolve, attachments.
- Preserve existing Connected Platforms CRUD and Telegram setWebhook flow.
- Validate workspace/outlet access through backend.
- Do not trust `outlet_id` query params as authorization.
- Keep Product status separate from outlet availability.
- Keep Payment status separate from Order status.

## Required working mode

Before changing code, respond with:

1. Docs read.
2. Current relevant files inspected.
3. Existing API readiness per page.
4. Proposed implementation order.
5. Files expected to change.
6. Risks and do-not-break list.
7. Test plan.

Then implement in safe phases.

## Recommended implementation order

```txt
1. Shared page patterns
2. Connected Platforms
3. Chat Center
4. Products
5. Settings
6. Payments
7. Responsive/accessibility/hardening
```

Products and Payments may require missing backend APIs. When an endpoint is missing:

- document the missing contract;
- use a clearly isolated mock adapter only for visual work if explicitly approved;
- do not make the UI pretend the feature is production-ready;
- do not change backend without stating the need first.

## Page requirements

Follow the five detailed page specs exactly. Use:

- page header;
- filter/search toolbar;
- active-filter chips only for non-default filters;
- optional summary cards;
- table/list/canvas;
- right detail drawer;
- loading/empty/error/unauthorized states;
- responsive mobile sheets/cards;
- role and outlet-aware actions.

## Quality gates

Run:

```bash
cd web
npm run build
npm run lint
```

Run any existing tests. Add focused tests for new state/logic where the project test setup supports them.

## Final report

Report:

1. Pages completed.
2. Files changed.
3. Components created/reused.
4. API endpoints used and missing.
5. Mock adapters, if any.
6. Permissions implemented.
7. Responsive/accessibility status.
8. Build/lint/test results.
9. Remaining risks and next step.
