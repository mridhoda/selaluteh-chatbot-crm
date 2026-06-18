# Outlet Selection Flow

## Purpose

Customer must select an outlet before product browsing/cart/checkout.

## Flow

```txt
/start
→ backend resolves workspace from platform/bot
→ upsert contact/chat
→ check active outlet context
→ if missing, show active outlets
→ customer selects outlet
→ save chat.current_outlet_id
→ show commerce menu
```

## Telegram Example

```txt
Halo kak 👋 Pilih outlet dulu ya:

[SelaluTeh Samarinda]
[SelaluTeh Tenggarong]
[SelaluTeh Bontang]
```

After selection:

```txt
Kamu memilih SelaluTeh Tenggarong ✅

[Lihat Produk]
[Keranjang]
[Status Pesanan]
[Ubah Outlet]
```

## Rules

- No product list without outlet.
- No cart without outlet.
- No checkout without outlet.
- Switching outlet with non-empty cart requires confirmation.

## Current Backend Implementation

- Telegram callback data uses compact actions such as `act:outlet:<outlet_id>`.
- `/start` shows active outlets when `chat.current_outlet_id` is missing.
- Selecting an outlet updates `chats.current_outlet_id` and `contacts.last_outlet_id`.
- Outlet selection is audited as AI action `select_outlet`.
- Product list callback `act:prod:list` returns outlet selection if no outlet is active.
