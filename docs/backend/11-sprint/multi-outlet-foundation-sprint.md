# Sprint 1.5 — Multi-Outlet Foundation

## Goal

Add multi-outlet foundation while keeping MVP single-workspace and future multi-workspace ready.

## Deliverables

- outlets table/model
- user_outlet_access table/model
- product_outlet_availability table/model
- outlet_id added to cart/checkout/order/payment
- outlet filter support in APIs
- Telegram outlet selection flow
- Orders UI outlet filter/column/detail
- outlet access tests

## Tasks

### Data

- create outlets
- create user_outlet_access
- create product_outlet_availability
- add outlet_id to operational tables
- add indexes
- seed initial outlets

### Backend

- AccessControlService
- OutletService
- ProductAvailabilityService
- update CartService
- update CheckoutService
- update OrderService
- update PaymentService

### UI

- outlet filter
- Orders outlet column
- Order detail Outlet Info
- product outlet availability controls

### Testing

- cross-outlet access
- Telegram outlet selection
- cart/checkout outlet binding
- payment webhook outlet mapping
