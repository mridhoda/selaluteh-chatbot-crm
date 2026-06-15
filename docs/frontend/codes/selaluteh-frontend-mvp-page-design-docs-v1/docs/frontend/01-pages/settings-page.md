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
