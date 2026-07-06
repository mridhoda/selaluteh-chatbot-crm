# Design: SelaluTeh Public Storefront QR Guest Checkout

## Frontend Architecture

The public storefront lives under `web/src/features/public-store/` and is intentionally separate from admin dashboard modules.

```text
web/src/features/public-store/
├── api/
├── components/
├── data/
├── hooks/
├── layouts/
├── pages/
├── types/
├── utils/
└── index.js
```

## Routing

Routes are registered in `web/src/routes/privateRoutes.jsx` because that file currently owns all application routes. Public store routes are inserted before `/app/*` and the catch-all route, and they are not wrapped in `DashboardLayout`.

## Layout

`PublicStoreLayout` provides mobile-first page framing with optional max width for desktop readability. It does not use admin dashboard layout components.

## API Adapter

`publicStoreApi` exposes a backend-ready contract while Phase 1 returns Promise-based mock data. Components call hooks, and hooks call the API adapter.

## State Boundaries

- `usePublicStorefront` loads and filters storefront data.
- `useGuestCart` owns cart state and display totals.
- `useCheckoutForm` validates and submits checkout input.
- `usePaymentStatus` refreshes mock payment state.
- `usePublicOrderStatus` loads and refreshes mock public order status.

## UI Components

Components are presentational where possible. Product modifier validation is contained in `ProductModifierSheet`; page components compose feature pieces and navigation.

## Testing

Current frontend test tooling uses Node's built-in test runner for pure JavaScript tests. Utility coverage is added for format, phone masking/normalization, and display total calculations. Component tests require a DOM test runner and remain a follow-up unless tooling is added.
