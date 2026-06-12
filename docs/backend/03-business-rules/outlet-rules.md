# Outlet Rules

## Core Rule

Workspace/account represents business owner or franchise owner.

Outlet represents physical branch/cabang under workspace.

## MVP Rule

MVP has one workspace with many outlets.

## Future Rule

Future production has many workspaces, each with many outlets.

## Commerce Rules

- Customer must select an active outlet before commerce.
- Cart belongs to exactly one outlet.
- Checkout copies outlet_id from cart.
- Order belongs to exactly one outlet.
- Payment belongs to the same outlet as order.
- Product must be available at selected outlet to be shown/orderable.

## Outlet Change Rule

If customer changes outlet while cart has items:

- clear cart and switch, or
- keep current outlet

Cart must not mix products from different outlets.

## Order Transfer Rule

Avoid changing outlet after payment. If allowed, require owner/admin, reason, audit log, and customer notification if needed.
