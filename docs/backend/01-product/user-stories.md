# User Stories

## Telegram Customer Stories

### Start Bot

As a Telegram customer, I want to start the bot, so that I can see available options.

Acceptance criteria:

- `/start` returns welcome message.
- Welcome message includes options like Browse Products, View Cart, Talk to Admin.
- Contact and chat are created or reused.

### Browse Products

As a customer, I want to browse products from Telegram, so that I can choose what to buy.

Acceptance criteria:

- Bot shows only active products.
- Product list includes name and price.
- Customer can select a product for detail.
- Pagination exists if products exceed safe message limit.

### View Product Detail

As a customer, I want to see product detail, so that I understand what I am buying.

Acceptance criteria:

- Bot shows name, description, price, and image if available.
- Bot shows available variants if any.
- Bot provides Add to Cart button.

### Add to Cart

As a customer, I want to add a product to cart, so that I can checkout later.

Acceptance criteria:

- Backend validates product is active.
- Backend validates variant availability if selected.
- Cart is created if none exists.
- Cart item quantity is updated if same item exists.
- Bot confirms item was added.

### View Cart

As a customer, I want to view my cart, so that I can confirm my order before checkout.

Acceptance criteria:

- Bot shows all cart items.
- Bot shows subtotal/total.
- Bot shows Checkout and Edit options.
- Empty cart shows helpful message.

### Checkout

As a customer, I want to checkout my cart, so that I can pay for my order.

Acceptance criteria:

- Backend validates cart is not empty.
- Backend creates checkout session.
- Backend creates pending order and order items after confirmation.
- Bot shows final order summary.
- Bot asks explicit confirmation before creating payment.

### Pay Order

As a customer, I want to receive a payment link, so that I can pay securely.

Acceptance criteria:

- Backend creates payment transaction with provider sandbox.
- Payment link is sent via Telegram.
- Payment status is pending until webhook success.
- Payment link is associated with one order.

### Payment Confirmation

As a customer, I want to receive confirmation after payment, so that I know my order is paid.

Acceptance criteria:

- Payment webhook is verified.
- Payment record is updated.
- Order status becomes paid/confirmed.
- Bot sends payment success notification.

### Talk to Admin

As a customer, I want to ask for human help, so that I can solve issues AI cannot handle.

Acceptance criteria:

- Bot marks chat as escalated or requests takeover.
- Admin sees chat in inbox.
- AI stops if human takeover is active.

---

## Admin Stories

### Manage Products

As an admin, I want to create and update products, so that Telegram catalog stays accurate.

Acceptance criteria:

- Admin can create product.
- Admin can edit price, description, status.
- Admin can upload product image.
- Inactive products do not appear in Telegram catalog.

### View Orders

As an admin, I want to view orders, so that I can process paid orders.

Acceptance criteria:

- Order list is workspace-scoped.
- Order list shows customer, total, status, payment status.
- Admin can open order detail.
- Order detail shows order items.

### Update Fulfillment Status

As an admin, I want to update order status, so that customer support can track progress.

Acceptance criteria:

- Admin can update allowed statuses only.
- Status transition follows business rules.
- Update is logged.
- Optional Telegram notification is sent.

### Human Takeover

As a human agent, I want to takeover a chat, so that AI stops responding.

Acceptance criteria:

- Takeover sets `takeover_by`.
- New customer messages do not trigger AI reply.
- Human reply is sent to Telegram and stored.

---

## Owner Stories

### Configure Telegram Platform

As an owner, I want to connect Telegram bot, so that customers can chat with the bot.

Acceptance criteria:

- Owner can save token.
- Owner can set webhook.
- Platform belongs to workspace.
- Token is not exposed to frontend unnecessarily.

### Monitor Product Performance

As an owner, I want to see basic metrics, so that I know whether Telegram commerce works.

Acceptance criteria:

- Dashboard can show number of chats, carts, checkouts, paid orders.
- Metrics are workspace-scoped.
- Failed payment/webhook count can be inspected.
