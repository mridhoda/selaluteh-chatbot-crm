# Backend Documentation Index

Project: **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**

Architecture mode:

```txt
MVP single workspace + multi outlet; future multi workspace/account/franchise owner + multi outlet
```

## Final Architecture Decision

### MVP Mode

```txt
Platform
  └── Workspace / Account: SelaluTeh
        ├── Outlet Samarinda
        ├── Outlet Tenggarong
        └── Outlet Bontang
```

### Future Production Mode

```txt
Platform
  ├── Workspace / Account / Franchise Owner A
  │     ├── Outlet A1
  │     └── Outlet A2
  ├── Workspace / Account / Franchise Owner B
  │     └── Outlet B1
  └── Workspace / Account / Franchise Owner C
        ├── Outlet C1
        └── Outlet C2
```

## Terminology

| Term | Meaning |
|---|---|
| Platform | The whole SaaS/application |
| Workspace / Account | Business account, merchant account, or franchise owner |
| Outlet | Physical branch/cabang under a workspace |
| Workspace Membership | User role inside a workspace |
| Outlet Access | User permission to operate one/many outlets |
| Product | Workspace-level product |
| Product Outlet Availability | Product availability/price/stock per outlet |
| Order | Transaction bound to one workspace and one outlet |
| Payment | Payment bound to order/workspace/outlet |

## Non-Negotiable Rules

1. Do not rebuild from scratch.
2. MVP may show only one workspace, but backend/database must be multi-workspace ready.
3. Workspace is not outlet.
4. All tenant-owned data must include `workspace_id`.
5. Outlet-operational data must include `outlet_id`.
6. Backend must validate workspace membership and outlet access server-side.
7. Customer must select outlet before product/cart/checkout.
8. Cart, checkout, order, and payment are bound to exactly one outlet.
9. AI must respect outlet context and cannot mark payment paid.
10. Payment webhook must be verified and idempotent.

## Updated Development Sequence

```txt
Sprint 0   — Stabilize existing CRM
Sprint 1   — Service boundaries + webhook idempotency
Sprint 1.5 — Multi-Outlet Foundation
Sprint 2   — Product catalog + outlet availability
Sprint 3   — Cart + Telegram outlet selection
Sprint 4   — Checkout + payment sandbox
Sprint 5   — Admin operations
Sprint 6   — MVP hardening
```
