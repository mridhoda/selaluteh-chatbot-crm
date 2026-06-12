# Decision Log

## Decision: MVP Single Workspace + Multi Outlet

Status: Accepted

MVP will use one workspace/account with many outlets.

## Decision: Future Multi Workspace + Multi Outlet

Status: Accepted

Future production must support multiple accounts/franchise owners, each with multiple outlets.

## Decision: Workspace Is Account, Outlet Is Branch

Status: Accepted

Workspace represents business owner/franchise owner. Outlet represents physical branch.

## Decision: workspace_id Everywhere Tenant-Owned

Status: Accepted

All tenant-owned data must include workspace_id.

## Decision: outlet_id for Outlet Operations

Status: Accepted

Cart, checkout, order, payment, complaints, and relevant chats must include outlet context.

## Decision: Customer Selects Outlet First

Status: Accepted for MVP

Reason: faster than location routing and clearer for first implementation.
