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
