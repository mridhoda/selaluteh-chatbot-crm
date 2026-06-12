# Notification Context

Dokumen ini memberi context notification backend.

## Notification Channels

Current external channels:

- Telegram,
- WhatsApp/Instagram via Meta,
- Email for OTP/reset.

MVP focus:

```txt
Telegram commerce notification
```

## Notification Events

Important events:

- order created,
- payment link created,
- payment paid,
- payment failed/expired,
- order processed,
- order completed,
- complaint created,
- human takeover.

## Rules

- Notification should not decide business state.
- State changes first, notification second.
- Failed notification should be logged/retried if important.
- Do not expose internal IDs unless user-facing order code exists.

## Telegram Notification Examples

```txt
Pembayaran berhasil ✅
Pesanan #ST-2026-0001 sedang diproses.
```

```txt
Link pembayaran sudah dibuat:
<payment_url>
Batas pembayaran: 30 menit.
```
