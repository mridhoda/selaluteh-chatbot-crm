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

Current canonical route:

```txt
/webhooks/telegram/v1/:connectionPublicId
```

Each request must include Telegram's `X-Telegram-Bot-Api-Secret-Token` header. The token is verified against the per-connection webhook secret hash stored on `channel_connections`.

Do not put bot tokens in webhook URLs.

Legacy tokenless routes such as `/webhook/telegram` must not perform tenant resolution by latest platform, first enabled platform, browser workspace, or any global fallback.

Tenant resolution order:

```txt
connection_public_id from URL
→ channel_connections row
→ per-connection webhook secret verification
→ workspace_id from channel_connections
```

## Message Idempotency

Deduplicate by:

```txt
connection_id + update_id
or
channel_connection_id + provider_message_id
```

Legacy `platform_id + update_id` is acceptable only for legacy processing paths. New Telegram v1 processing uses exact channel connection scope.

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
