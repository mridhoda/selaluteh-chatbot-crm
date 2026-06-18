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
