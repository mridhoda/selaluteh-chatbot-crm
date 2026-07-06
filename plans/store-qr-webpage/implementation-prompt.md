# Implementasi Frontend QR Online Store / Guest Checkout secara Modular dan Scalable

Saya sedang mengembangkan frontend **SelaluTeh Marketplace / Foodinesia internal system** berbasis React/Vite. Saya sudah punya prototype UI dalam satu file berisi:

```text
StorefrontPage
ProductSheet
CartDrawer
CheckoutView
PaymentPendingView
OrderStatusView
mock product data
mock cart state
mock payment success
```

Prototype tersebut hanya referensi visual dan interaction flow. Jangan implementasikan sebagai satu file besar. Tolong ubah menjadi struktur frontend yang rapi, scalable, maintainable, dan siap diintegrasikan ke backend existing.

Module yang ingin dibuat:

```text
QR Online Store / Public Storefront / Guest Checkout
```

Flow customer:

```text
Scan QR
→ Storefront / Menu
→ Product Detail + Modifier
→ Cart Drawer
→ Checkout Customer Data
→ Payment Pending / Redirect
→ Order Status + Invoice
```

Customer tidak login. Customer hanya mengisi:

```text
Nama
Nomor WhatsApp
Catatan opsional
```

Order bersifat:

```text
Pickup only
Outlet berasal dari QR / storefront
Payment via payment gateway
Invoice public token
```

---

# 1. Tujuan Implementasi

Implementasikan UI frontend module **Public Storefront** ke project existing dengan prinsip:

```text
feature-based architecture
mobile-first
typed data model
clean component boundaries
API layer terpisah
hooks terpisah
utils terpisah
dummy data terpisah
tidak ada business logic besar di page
tidak ada monolithic App component
tidak ada direct price/payment authority di frontend
```

Frontend boleh menghitung preview total untuk tampilan sementara, tetapi **harga final tetap dari backend**.

---

# 2. Penting: Jangan Campur dengan Admin Dashboard Shell

Online store ini adalah public customer-facing page, bukan halaman admin dashboard.

Jangan bungkus route public store dengan:

```text
AdminSidebar
AdminNavbar
AuthenticatedLayout
WorkspaceDashboardLayout
```

Buat layout public khusus:

```text
PublicStoreLayout
```

Admin dashboard nanti boleh punya menu `Online Store`, tetapi itu untuk mengelola setting storefront/QR, bukan customer ordering page.

Public route harus bisa dibuka tanpa login:

```text
/store/:storefrontSlug
/store/:storefrontSlug/checkout
/store/payment/pending/:checkoutToken
/store/order/:publicOrderToken
```

---

# 3. Audit Frontend Terlebih Dahulu

Sebelum menulis kode, audit struktur frontend project.

Cari:

```bash
find web/src -maxdepth 3 -type f | sort
rg -n "Routes|BrowserRouter|createBrowserRouter|react-router" web/src
rg -n "DashboardLayout|AppLayout|Sidebar|Navbar|ProtectedRoute" web/src
rg -n "axios|fetch|apiClient|httpClient" web/src
rg -n "formatCurrency|rupiah|currency" web/src
rg -n "Button|Card|Sheet|Modal|Drawer|Input" web/src
rg -n "tailwind|cn\\(|classNames" web/src
```

Laporkan dulu:

```text
current routing structure
layout structure
existing api client
existing UI components
existing utility functions
existing feature folder pattern
where public routes should be registered
files to create
files to modify
risk area
```

Jangan menebak struktur folder. Ikuti pattern project existing.

---

# 4. Target Folder Structure

Jika project belum punya pattern yang lebih baik, gunakan struktur ini:

```text
web/src/features/public-store/
├── api/
│   ├── publicStoreApi.ts
│   └── publicStoreEndpoints.ts
│
├── components/
│   ├── StoreHeader.tsx
│   ├── OutletPickupBadge.tsx
│   ├── HeroBanner.tsx
│   ├── StoreSearchBar.tsx
│   ├── CategoryTabs.tsx
│   ├── ProductGrid.tsx
│   ├── ProductCard.tsx
│   ├── ProductModifierSheet.tsx
│   ├── ModifierGroup.tsx
│   ├── QuantityStepper.tsx
│   ├── FloatingCartButton.tsx
│   ├── CartDrawer.tsx
│   ├── CartItemRow.tsx
│   ├── CartSummary.tsx
│   ├── CustomerCheckoutForm.tsx
│   ├── PickupOutletCard.tsx
│   ├── OrderSummaryCard.tsx
│   ├── PaymentPendingCard.tsx
│   ├── OrderStatusTimeline.tsx
│   ├── PublicInvoiceActions.tsx
│   ├── StoreEmptyState.tsx
│   ├── StoreErrorState.tsx
│   └── StoreSkeleton.tsx
│
├── data/
│   └── publicStore.mock.ts
│
├── hooks/
│   ├── usePublicStorefront.ts
│   ├── useGuestCart.ts
│   ├── useCheckoutForm.ts
│   ├── usePaymentStatus.ts
│   └── usePublicOrderStatus.ts
│
├── layouts/
│   └── PublicStoreLayout.tsx
│
├── pages/
│   ├── StorefrontPage.tsx
│   ├── CheckoutPage.tsx
│   ├── PaymentPendingPage.tsx
│   └── OrderStatusPage.tsx
│
├── types/
│   ├── publicStore.types.ts
│   ├── cart.types.ts
│   ├── checkout.types.ts
│   └── orderStatus.types.ts
│
├── utils/
│   ├── formatCurrency.ts
│   ├── maskPhone.ts
│   ├── calculateDisplayTotal.ts
│   ├── normalizePhone.ts
│   └── storefrontTheme.ts
│
└── index.ts
```

Kalau project masih JavaScript, boleh gunakan `.jsx` dan JSDoc. Kalau TypeScript sudah aktif, gunakan `.tsx`.

---

# 5. Routing

Tambahkan public routes tanpa auth guard.

Contoh target:

```tsx
<Route path="/store/:storefrontSlug" element={<StorefrontPage />} />
<Route path="/store/:storefrontSlug/checkout" element={<CheckoutPage />} />
<Route path="/store/payment/pending/:checkoutToken" element={<PaymentPendingPage />} />
<Route path="/store/order/:publicOrderToken" element={<OrderStatusPage />} />
```

Jika routing project menggunakan `createBrowserRouter`, sesuaikan.

Pastikan route public store tidak terkena redirect login.

---

# 6. Data Model Type

Buat type yang jelas.

```ts
export type MoneyMinor = number;

export type Storefront = {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  channel: "WEB_STORE";
  source: "QR" | "DIRECT_LINK" | "CAMPAIGN";
  fulfillmentMethod: "PICKUP";
  theme: StorefrontTheme;
  outlet: StorefrontOutlet;
  banner?: StorefrontBanner;
};

export type StorefrontTheme = {
  primaryColor: string;
  primarySoftColor?: string;
  logoUrl?: string;
};

export type StorefrontOutlet = {
  id: string;
  name: string;
  address: string;
  isLockedFromQr: boolean;
};

export type StoreCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type StoreProduct = {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  basePriceMinor: MoneyMinor;
  imageUrl?: string;
  isAvailable: boolean;
  availabilityLabel?: string;
  badges?: Array<"PROMO" | "NEW" | "SOLD_OUT">;
  modifierGroups: ModifierGroup[];
};

export type ModifierGroup = {
  id: string;
  title: string;
  isRequired: boolean;
  type: "SINGLE" | "MULTIPLE";
  minSelect?: number;
  maxSelect?: number;
  options: ModifierOption[];
};

export type ModifierOption = {
  id: string;
  name: string;
  priceDeltaMinor: MoneyMinor;
  isAvailable: boolean;
};

export type GuestCart = {
  id: string;
  storefrontId: string;
  outletId: string;
  items: GuestCartItem[];
  totals: CartTotals;
};

export type GuestCartItem = {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  quantity: number;
  selectedVariantId?: string;
  selectedModifierOptionIds: string[];
  modifierSummary: string[];
  note?: string;
  unitPriceMinor: MoneyMinor;
  lineTotalMinor: MoneyMinor;
};

export type CartTotals = {
  subtotalMinor: MoneyMinor;
  serviceFeeMinor: MoneyMinor;
  discountMinor: MoneyMinor;
  totalMinor: MoneyMinor;
};

export type CheckoutCustomerInput = {
  name: string;
  phone: string;
  note?: string;
};

export type PublicOrderStatus =
  | "PAYMENT_PENDING"
  | "PAID"
  | "AWAITING_OUTLET_APPROVAL"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_EXPIRED";

export type PublicOrder = {
  orderNumber: string;
  queueNumber?: string;
  status: PublicOrderStatus;
  customer: {
    name: string;
    phoneMasked: string;
  };
  outlet: StorefrontOutlet;
  items: GuestCartItem[];
  totals: CartTotals;
  invoice?: {
    downloadUrl: string;
    shareUrl: string;
  };
};
```

---

# 7. Mock Data Terpisah

Pindahkan mock data dari prototype ke:

```text
web/src/features/public-store/data/publicStore.mock.ts
```

Mock data minimal:

```text
storefront
categories
products
cart
order
```

Jangan simpan mock data di component page.

Buat API mode mock dulu, lalu siapkan adapter untuk backend.

---

# 8. API Layer

Buat file:

```text
publicStoreApi.ts
```

Dengan contract:

```ts
export const publicStoreApi = {
  getStorefront,
  createGuestSession,
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  checkout,
  getPaymentStatus,
  getPublicOrder,
};
```

Untuk Phase 1, API boleh return mock data via Promise.

Contoh:

```ts
const USE_MOCK_PUBLIC_STORE = true;
```

Nanti mudah diganti ke real API.

Jangan panggil `fetch` langsung dari components.

---

# 9. Hooks

## `usePublicStorefront`

Tanggung jawab:

```text
load storefront
load categories
load products
handle loading
handle error
filter search query
filter category
```

## `useGuestCart`

Tanggung jawab:

```text
hold cart state
add item
update quantity
remove item
open/close cart drawer helper boleh di page
calculate display count
calculate display total
```

Tetapi ingat:

```text
display total hanya untuk UI mock
final total tetap dari backend
```

## `useCheckoutForm`

Tanggung jawab:

```text
form state
validation
normalize phone
submit checkout
loading/error
```

## `usePublicOrderStatus`

Tanggung jawab:

```text
load public order by token
refresh status
map backend status to UI timeline
```

---

# 10. Page Responsibilities

## 10.1 StorefrontPage

Page hanya compose:

```tsx
<PublicStoreLayout>
  <StoreHeader />
  <OutletPickupBadge />
  <HeroBanner />
  <StoreSearchBar />
  <CategoryTabs />
  <ProductGrid />
  <FloatingCartButton />
  <ProductModifierSheet />
  <CartDrawer />
</PublicStoreLayout>
```

Page tidak boleh punya logic modifier besar.

## 10.2 CheckoutPage

Compose:

```tsx
<PublicStoreLayout>
  <CheckoutHeader />
  <PickupOutletCard />
  <CustomerCheckoutForm />
  <OrderSummaryCard />
  <StickyPaymentButton />
</PublicStoreLayout>
```

## 10.3 PaymentPendingPage

Compose:

```tsx
<PublicStoreLayout>
  <PaymentPendingCard />
</PublicStoreLayout>
```

State:

```text
creating
redirecting
pending
expired
failed
```

## 10.4 OrderStatusPage

Compose:

```tsx
<PublicStoreLayout>
  <PaymentResultCard />
  <OrderStatusTimeline />
  <CustomerInfoCard />
  <PickupOutletCard />
  <OrderSummaryCard />
  <PublicInvoiceActions />
</PublicStoreLayout>
```

---

# 11. Component Requirements

## StoreHeader

Props:

```ts
type StoreHeaderProps = {
  brandName: string;
  logoUrl?: string;
  cartCount: number;
  onOpenCart: () => void;
  onSearchFocus?: () => void;
};
```

## OutletPickupBadge

Props:

```ts
type OutletPickupBadgeProps = {
  outletName: string;
  outletAddress?: string;
  isLockedFromQr?: boolean;
};
```

Microcopy:

```text
Pesanan ini untuk pickup di outlet ini.
```

## ProductCard

Props:

```ts
type ProductCardProps = {
  product: StoreProduct;
  onSelect: (product: StoreProduct) => void;
};
```

Product unavailable:

```text
Sold Out
button disabled
```

## ProductModifierSheet

Responsibilities:

```text
show product image/name/description/base price
render modifier groups
validate required groups
quantity stepper
item note
CTA with preview total
call onAdd with canonical IDs only
```

Do not pass free-form modifier names as price authority.

Pass:

```ts
{
  productId,
  quantity,
  selectedModifierOptionIds,
  note
}
```

## CartDrawer

Responsibilities:

```text
show outlet
items
quantity controls
remove
totals
checkout CTA
empty state
```

## CustomerCheckoutForm

Fields:

```text
name required
phone required
note optional
```

Validation:

```text
name minimum 2 characters
phone numeric and normalized
```

## OrderStatusTimeline

Map:

```text
PAYMENT_PENDING → Menunggu Pembayaran
PAID → Dibayar
AWAITING_OUTLET_APPROVAL → Diproses Outlet
PREPARING → Sedang Dibuat
READY_FOR_PICKUP → Siap Diambil
COMPLETED → Selesai
CANCELLED → Dibatalkan
```

## PublicInvoiceActions

Buttons:

```text
Download Invoice PDF
Bagikan Invoice
Kembali ke Menu
```

---

# 12. Styling Requirements

Gunakan Tailwind dan design token yang rapi.

Jangan menaruh styling besar inline berulang-ulang.

Boleh buat helper:

```ts
getStorefrontThemeVars(theme)
```

Contoh:

```tsx
<div
  style={{
    "--store-primary": theme.primaryColor,
  } as React.CSSProperties}
>
```

Gunakan class utility konsisten:

```text
rounded-2xl
border border-gray-100
bg-white
shadow-sm
text-gray-900
text-gray-500
```

CTA utama:

```text
bg-[var(--store-primary)]
text-white
rounded-xl
h-12 atau py-3.5
font-semibold
```

Minimum touch target:

```text
44px
```

Mobile-first. Jangan hardcode desktop phone frame untuk production.

Prototype lama punya wrapper seperti:

```text
max-w-md
h-screen
desktop phone frame
border device
```

Untuk production:

```text
min-h-screen
w-full
max-w-md mx-auto optional
```

Boleh pakai `max-w-md mx-auto` agar nyaman di desktop, tapi jangan pakai frame device/border hitam.

---

# 13. State dan Navigation Behavior

## Storefront

* load data;
* category default first category;
* search filter;
* click product opens modifier sheet;
* add item updates cart;
* cart button opens drawer.

## Modifier Sheet

* close by X or backdrop;
* validate required modifier;
* quantity min 1 max 20 for UI preview;
* on add, close sheet and show cart feedback.

## Cart Drawer

* empty state;
* update quantity;
* remove item;
* checkout navigates to `/store/:storefrontSlug/checkout`.

## Checkout

* back returns storefront;
* submit validates;
* call checkout API;
* redirect to payment URL or navigate payment pending.

## Payment Pending

* show countdown;
* `Bayar Sekarang` opens payment URL;
* `Cek Status Pembayaran` refreshes status;
* if paid, navigate to `/store/order/:publicOrderToken`.

## Order Status

* show status timeline;
* refresh status;
* download invoice;
* share invoice;
* back to menu.

---

# 14. Security and Business Rules Frontend

Frontend must not:

```text
send unitPrice as authority
send total as authority
set payment status
create order directly without checkout API
show full phone on public order page
show internal notes
show inventory/COGS
show admin fields
require customer login
```

Frontend may send:

```text
productId
quantity
variant/modifier option IDs
customer name
customer phone
customer note
guest session token
```

Backend decides:

```text
availability
pricing
tax/fee
payment
invoice
status
```

---

# 15. Accessibility

Implement:

```text
visible labels for inputs
button type="button" where needed
aria-label for icon buttons
keyboard accessible bottom sheet close
focus state visible
error text near field
disabled state clear
loading state clear
no horizontal overflow
```

Touch target:

```text
minimum 44px
```

---

# 16. Loading and Error States

Implement states:

## Storefront

```text
loading skeleton
store not found
store inactive
empty product
failed to load
```

## Product

```text
sold out
modifier required missing
add cart failed
```

## Cart

```text
empty cart
update failed
item unavailable
```

## Checkout

```text
validation error
checkout failed
payment session failed
```

## Payment

```text
pending
expired
failed
paid
```

## Order

```text
not found
token expired
loading
refresh failed
```

---

# 17. Testing

Tambahkan test sesuai tool project jika sudah ada.

Minimal:

```text
ProductCard render available/sold out
ProductModifierSheet required modifier validation
QuantityStepper min/max
CartDrawer empty and filled states
Checkout form validation
OrderStatusTimeline status mapping
maskPhone utility
formatCurrency utility
```

Jika sudah ada E2E:

```text
open storefront
select category
open product
select modifier
add to cart
checkout
fill customer data
payment pending
mock success
order status
```

---

# 18. Phase Implementation

## Phase 1 — Modular Static UI

* Create folder structure.
* Move mock data to `data/publicStore.mock.ts`.
* Create types.
* Create components.
* Create pages.
* Add public routes.
* Use mock API.

## Phase 2 — Local Interaction

* Category filter.
* Search.
* Modifier sheet.
* Quantity.
* Add to cart.
* Cart drawer.
* Checkout form validation.
* Payment pending mock.
* Order status mock.

## Phase 3 — API Adapter Ready

* Build `publicStoreApi`.
* Keep mock mode switch.
* Define request/response types.
* No direct backend integration required yet unless existing API is already available.

## Phase 4 — Polish

* Loading states.
* Error states.
* Empty states.
* Responsive polish.
* Accessibility pass.
* Basic tests.

---

# 19. Refactor Existing Prototype Carefully

The uploaded prototype currently has:

```text
STORE_INFO constant in component file
CATEGORIES constant in component file
MOCK_PRODUCTS in component file
formatRupiah in same file
maskPhone in same file
generateId in same file
single App controls all views
local cart state
local payment simulator
ProductSheet computes local price
CartDrawer computes service fee locally
desktop phone frame wrapper
```

Refactor into:

```text
mock data → data/publicStore.mock.ts
formatRupiah → utils/formatCurrency.ts
maskPhone → utils/maskPhone.ts
generateId → remove or put in mock util only
view state → real router pages
cart state → useGuestCart hook
payment mock → api mock adapter
product sheet → component
cart drawer → component
checkout form → component
status timeline → component
desktop frame → remove from production route
```

Keep the visual feel, but improve architecture.

---

# 20. Acceptance Criteria

Implementation is acceptable when:

1. Public store routes exist and are not behind login.
2. Code is feature-based under `features/public-store`.
3. No monolithic `App` implementation.
4. Mock data is separated.
5. API layer is separated.
6. Hooks are separated.
7. Utils are separated.
8. Storefront page renders menu, category, products, and cart CTA.
9. Product modifier sheet works.
10. Cart drawer works.
11. Checkout page validates name and WhatsApp.
12. Payment pending page works with mock state.
13. Order status page shows status, customer data, outlet, invoice actions.
14. UI is mobile-first and responsive.
15. Desktop phone frame wrapper is not used in production route.
16. No frontend payment authority.
17. No frontend price authority beyond display preview.
18. Code passes lint/build.
19. Basic tests added or test plan included if project has no test runner.
20. AI agent reports all files created/modified and how to run.

---

# 21. Output Report Required

After implementation, provide:

```text
1. Summary of implementation
2. Folder structure created
3. Files created
4. Files modified
5. Routes added
6. Components added
7. Hooks added
8. Utilities added
9. Mock API behavior
10. How to run and preview
11. Known limitations
12. Next backend integration steps
13. Test results / build results
```

Do not claim complete if build fails or routes cannot be opened.

---

Start by auditing the existing frontend structure and router. Then propose file-by-file plan. After that implement Phase 1 and Phase 2 using the uploaded prototype only as visual reference, not as final architecture.
