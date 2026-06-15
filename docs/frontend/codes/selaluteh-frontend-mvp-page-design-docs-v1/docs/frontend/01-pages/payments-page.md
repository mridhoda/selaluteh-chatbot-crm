# Payments Page Design Specification

## 1. Purpose

Payments adalah operational transaction page untuk melihat hubungan antara order, payment link, provider event, dan final payment status.

Payment page tidak boleh menjadi tempat admin mengubah transaksi menjadi `paid` secara manual. Payment gateway webhook atau verified backend reconciliation adalah source of truth.

## 2. Route and module

```txt
Route: /app/payments
Page: web/src/modules/payments/pages/PaymentsPage.jsx
API: web/src/modules/payments/api/paymentsApi.js
Components: web/src/modules/payments/components/*
```

## 3. Header

```txt
Payments
Monitor payment links and transactions across all outlets
```

Right actions:

- `Export` — only when supported;
- Refresh icon + last updated;
- no `Create Payment` global button for normal use.

Payment links should originate from order checkout, not arbitrary standalone creation.

## 4. Filter toolbar

```txt
Outlet
Date Range
Payment Status
Provider / Method
Channel
Search
```

Payment status options:

```txt
Pending
Paid
Expired
Failed
Cancelled
Refunded (read-only/P1 unless refund is implemented)
```

Search by:

- payment ID;
- order ID;
- customer name/phone;
- provider reference.

## 5. Summary cards

Recommended maximum five:

1. Total Collected
2. Pending
3. Paid Transactions
4. Failed / Expired
5. Needs Attention

`Needs Attention` examples:

- provider status mismatch;
- payment paid but order not updated;
- duplicate webhook event;
- payment link creation failed;
- webhook signature rejected;
- payment pending beyond expected time.

Metrics must follow selected date and outlet context.

## 6. Main table

Recommended columns:

```txt
Payment ID
Order
Customer
Outlet
Channel
Provider / Method
Amount
Payment Status
Created At
Actions
```

Optional columns through column selector:

```txt
Provider Reference
Expires At
Last Event
Updated At
```

### Payment ID cell

- internal short ID;
- provider reference secondary text;
- warning icon for mismatch/attention.

### Order cell

- clickable order ID;
- order status secondary text.

### Provider/method

Examples:

```txt
Midtrans · QRIS
Xendit · E-Wallet
Cash on Delivery
Manual Transfer (legacy only)
```

Do not imply provider integration exists until implemented.

### Row actions

- View details
- Open order
- Open chat
- Copy payment link
- Resend payment link
- Regenerate link only when backend explicitly supports safe regeneration

Never provide `Mark as Paid` in production UI.

## 7. Payment detail drawer

Header:

```txt
Payment #PAY-...
[status badge]
Order #ORD-...
```

Sections:

### A. Payment summary

```txt
Amount
Provider
Method
Status
Created at
Expires at
Paid at
Provider reference
```

### B. Customer and outlet

```txt
Customer name
Contact
Channel
Outlet
```

### C. Related order

```txt
Order ID
Order status
Order total
Items count
[Open Order]
```

### D. Payment link

- masked/shortened display;
- Copy link;
- Resend to customer;
- expiration indicator;
- do not expose secret callback data.

### E. Event timeline

Events ordered ascending or descending consistently:

```txt
Payment created
Link generated
Customer opened link (only if provider supports)
Webhook received
Signature verified
Provider status mapped
Order marked paid
Notification sent
```

Each event shows:

- timestamp;
- event type;
- result;
- retry count if relevant;
- provider event ID;
- safe error summary.

Do not render raw secrets or full sensitive payload.

### F. Diagnostics

Visible only to privileged roles:

- idempotency key;
- webhook verification status;
- last synchronization;
- safe provider response summary.

## 8. Status behavior

### Pending

Actions:

- copy/resend link;
- open chat;
- cancel only if provider/backend supports it.

### Paid

Actions:

- open order;
- open chat;
- view events.

No destructive mutation.

### Expired

Actions:

- regenerate payment link through order flow if supported;
- never silently reuse expired link.

### Failed

Actions:

- inspect event;
- retry link creation if failure occurred before customer payment;
- escalate to support when provider state is unclear.

## 9. Empty/loading/error states

### No payments yet

```txt
No payment transactions yet
Payments will appear after a customer confirms checkout.
```

### Gateway not configured

```txt
Payment gateway is not configured
Configure a sandbox provider in Settings before enabling checkout payments.
[Open Payment Settings]
```

### Error

Keep filters and show Retry. Do not reset user context.

## 10. Permissions and security

- Owner/Super Admin: all allowed outlets.
- Outlet Manager: payments related to assigned outlets only.
- Human Agent: read payment summary for chats/orders they can access; resend link only when permitted.
- Provider credentials are never displayed in this page.
- Sensitive webhook payload is redacted.
- Frontend must not infer paid state from customer screenshot or chat message.

## 11. API expectations

Suggested list query:

```http
GET /payments?outlet_id=&status=&provider=&channel=&date_from=&date_to=&search=&page=&limit=
```

Suggested detail:

```http
GET /payments/:id
GET /payments/:id/events
```

Operational actions:

```http
POST /payments/:id/resend-link
POST /orders/:orderId/payment-link
POST /payments/:id/reconcile   # privileged, optional
```

There must be no general endpoint such as:

```http
PATCH /payments/:id { status: "paid" }
```

## 12. Required components

```txt
PaymentsPage.jsx
PaymentsToolbar.jsx
PaymentsSummaryCards.jsx
PaymentsTable.jsx
PaymentStatusBadge.jsx
PaymentDetailDrawer.jsx
PaymentSummarySection.jsx
PaymentEventTimeline.jsx
PaymentLinkActions.jsx
PaymentAttentionBadge.jsx
```

## 13. Acceptance criteria

- Payment and order statuses remain separate.
- No manual mark-paid action exists.
- Outlet filter restricts results correctly.
- Payment detail shows event timeline.
- Resend/copy link only appears when valid.
- Expired/failed states have explicit recovery guidance.
- Sensitive values are masked/redacted.
- Page supports loading, empty, error, and unauthorized states.
