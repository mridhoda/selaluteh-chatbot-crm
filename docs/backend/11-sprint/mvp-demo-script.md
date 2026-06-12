# MVP Demo Script

Use this script to verify the product is demoable.

## Setup

- Admin account exists.
- Telegram bot connected.
- Sample products active.
- Payment provider sandbox configured.
- Backend public webhook URL active.

## Demo Flow

### 1. Admin Login

- Open dashboard.
- Confirm inbox loads.
- Confirm products page loads.

Expected:

```txt
Admin can operate dashboard normally.
```

### 2. Telegram Start

User sends:

```txt
/start
```

Expected bot response:

```txt
Welcome message + marketplace menu.
```

### 3. Product Browse

User taps:

```txt
View Products
```

Expected:

```txt
Product list with inline buttons.
```

### 4. Add to Cart

User taps product and adds to cart.

Expected:

```txt
Cart updated message.
```

### 5. Checkout

User taps checkout.

Expected:

```txt
Order summary and confirm checkout button.
```

### 6. Payment

User confirms checkout.

Expected:

```txt
Payment link is sent.
```

### 7. Webhook Payment

Simulate sandbox payment.

Expected:

```txt
Payment webhook updates payment and order.
Telegram user receives paid notification.
```

### 8. Admin Review

Admin opens order.

Expected:

```txt
Order is visible with items and payment status.
```

## Demo Pass Criteria

- No manual database edits.
- No duplicated webhook effects.
- Payment status is not set by AI.
- Human takeover still works.
