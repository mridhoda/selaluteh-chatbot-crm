# Architecture

## Updated Architecture

```txt
Platform
  └── Workspace / Account / Franchise Owner
        └── Outlet / Branch
              └── Cart
              └── Checkout
              └── Order
              └── Payment
```

## MVP

The UI may only show one workspace, but backend must still use workspace-aware design.

## Future Production

Multiple franchise owners can have separate workspaces. Each workspace can have many outlets.

## Request Context

Every authenticated request should resolve:

```txt
user
workspace membership
allowed outlet ids
requested outlet id
```

## Service Modules

Recommended:

- WorkspaceService
- OutletService
- AccessControlService
- ProductAvailabilityService
- CartService
- CheckoutService
- OrderService
- PaymentService
- TelegramCommerceService
- WebhookEventService

## Rule

Do not hardcode a single workspace or treat outlet as account.
