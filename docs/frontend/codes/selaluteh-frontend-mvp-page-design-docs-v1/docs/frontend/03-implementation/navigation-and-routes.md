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
