# Telegram Bot Security

## Telegram Identity

Use Telegram stable ids, not username.

```txt
chat.id
from.id
message_id
update_id
```

Usernames and display names can change and are not secure identifiers.

## Webhook URL

Recommended:

```txt
/webhook/telegram/:tokenOrSecret
```

or use Telegram secret token header if supported by your integration approach.

## Message Idempotency

Deduplicate by:

```txt
platform_id + update_id
or
chat_id + platform_message_id
```

## Telegram Callback Query

Inline buttons must encode only safe action ids.

Good:

```txt
cart:add:<product_id>
cart:view
checkout:start
```

Bad:

```txt
{"workspace_id":"...","price":1,"markPaid":true}
```

Backend must load product/cart/order from DB and validate workspace/contact/session.

## Telegram Commerce Actions

User can request:

```txt
show product list
show product detail
add to cart
view cart
checkout
check order status
```

User cannot directly request:

```txt
mark payment paid
change product price
change stock
view another customer order
```

## Bot Spam Handling

- rate-limit per Telegram user/contact;
- support block/blacklist flag on contact;
- skip AI for abusive contacts;
- do not create unlimited carts/payment links.
