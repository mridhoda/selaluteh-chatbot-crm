# Quick Prompt for AI Agent

```txt
Latest decision:
MVP is single workspace/account with multiple outlets.
Future production is multi-workspace/multi-account/multi-franchise owner, where each workspace has multiple outlets.

Workspace = account/business/franchise owner.
Outlet = branch/cabang under workspace.

Do not rebuild from scratch.
Do not break existing CRM.
Do not hardcode single workspace.
All tenant data must be workspace-scoped.
Cart/checkout/order/payment must be outlet-bound.
Customer must select outlet before Telegram commerce.
Admin dashboard must filter by outlet.
Backend must validate outlet access server-side.
AI must respect outlet context and cannot mark payment paid.

Before coding, read docs/backend/READING-ORDER.md.
```
