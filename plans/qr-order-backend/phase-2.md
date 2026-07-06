**Phase 2 — Backend API Contract untuk Online/QR Store** 

Fokusnya: bikin kontrak API yang cukup kuat untuk **alpha testing QR/Online ordering**, belum full POS/ERP.

Audit sebelumnya sudah jelas menunjukkan blocker utama: checkout/payment masih mock, payment bisa berubah paid dari client, QR/session belum lengkap, dan admin bisa memproses unpaid order. Jadi Phase 2 ini kita desain supaya masalah itu tertutup dari sisi backend contract. 

---

# Phase 2 — Backend API Contract

## Tujuan Phase 2

Backend harus menjadi **source of truth** untuk:

```txt
Outlet context
QR session
Product availability
Cart validation
Final price calculation
Order creation
Payment status
Order fulfillment transition
Public order status
Admin permission
Audit log
```

Frontend boleh menampilkan preview, tapi keputusan final harus dari backend.

---

# 1. API Grouping

Aku sarankan API dibagi menjadi 4 group:

```txt
/public/*     → customer online/QR store
/admin/*      → staff/admin dashboard
/webhooks/*   → payment provider webhook
/internal/*   → system/internal service jika diperlukan nanti
```

Base path:

```txt
/api/v1
```

---

# 2. Public Customer API

Ini API untuk customer yang buka online store atau scan QR.

---

## 2.1 Get Online Storefront

Untuk online store biasa.

```http
GET /api/v1/public/stores/:storefrontSlug
```

Contoh:

```http
GET /api/v1/public/stores/selkop
```

### Response

```json
{
  "storefront": {
    "id": "store_001",
    "slug": "selkop",
    "name": "SELKOP",
    "brandline": "Born Local For Everyone",
    "ordering_enabled": true
  },
  "outlets": [
    {
      "id": "outlet_smd",
      "name": "SELKOP Samarinda",
      "address": "Jl. Example Samarinda",
      "is_open": true,
      "ordering_enabled": true,
      "pickup_enabled": true,
      "dine_in_enabled": false,
      "takeaway_enabled": true
    }
  ],
  "menu": {
    "categories": [],
    "products": []
  }
}
```

### Rules

| Rule                                         | Keterangan |
| -------------------------------------------- | ---------- |
| Online store boleh pilih outlet              | Ya         |
| Outlet unavailable harus dikirim ke frontend | Ya         |
| Product availability harus outlet-aware      | Ya         |
| Harga final tetap dihitung saat checkout     | Ya         |

---

## 2.2 Validate QR Token

Untuk customer yang scan QR.

```http
GET /api/v1/public/qr/:qrToken
```

Contoh:

```http
GET /api/v1/public/qr/qr_smd_table_07_token
```

### Response Success

```json
{
  "qr_session": {
    "id": "qrs_001",
    "session_token": "qrs_public_token_abc",
    "qr_code_id": "qr_001",
    "channel": "qr_store",
    "outlet_locked": true,
    "expires_at": "2026-07-06T15:00:00.000Z"
  },
  "outlet": {
    "id": "outlet_smd",
    "name": "SELKOP Samarinda",
    "address": "Jl. Example Samarinda",
    "is_open": true,
    "ordering_enabled": true
  },
  "qr_context": {
    "location_type": "table",
    "location_label": "Meja 07",
    "fulfillment_type": "dine_in"
  },
  "menu": {
    "categories": [],
    "products": []
  }
}
```

### Response Invalid QR

```json
{
  "error": {
    "code": "QR_INVALID",
    "message": "QR tidak valid. Silakan scan ulang QR resmi dari outlet SELKOP."
  }
}
```

### Response Expired QR

```json
{
  "error": {
    "code": "QR_EXPIRED",
    "message": "QR sudah kedaluwarsa. Silakan scan ulang QR terbaru."
  }
}
```

### Rules

| Rule                                                          | Keterangan               |
| ------------------------------------------------------------- | ------------------------ |
| QR harus mengikat outlet                                      | Wajib                    |
| QR bisa mengikat meja/lokasi                                  | Opsional tapi disarankan |
| Customer tidak boleh ganti outlet jika `outlet_locked = true` | Wajib                    |
| QR invalid/expired harus punya state khusus                   | Wajib                    |

---

# 3. Cart API

Untuk alpha, kamu punya 2 opsi:

| Opsi                          | Keterangan                                             | Rekomendasi                         |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------- |
| Local cart + backend validate | Cart disimpan frontend, backend validasi saat checkout | Cocok untuk alpha cepat             |
| Server cart                   | Cart dibuat dan disimpan backend                       | Lebih kuat, tapi lebih banyak kerja |

Untuk alpha, aku sarankan:

> **Frontend boleh simpan cart lokal, tapi wajib validate cart ke backend sebelum checkout.**

---

## 3.1 Validate Cart

```http
POST /api/v1/public/carts/validate
```

### Request

```json
{
  "channel": "qr_store",
  "storefront_slug": "selkop",
  "outlet_id": "outlet_smd",
  "qr_session_token": "qrs_public_token_abc",
  "fulfillment_type": "dine_in",
  "items": [
    {
      "product_id": "prod_salty_caramel",
      "quantity": 2,
      "modifiers": [
        {
          "modifier_group_id": "mg_ice",
          "option_id": "ice_less"
        }
      ],
      "note": "Less sweet"
    }
  ]
}
```

### Response Valid

```json
{
  "valid": true,
  "cart_snapshot": {
    "currency": "IDR",
    "subtotal_amount": 42000,
    "discount_amount": 0,
    "service_fee_amount": 0,
    "tax_amount": 0,
    "total_amount": 42000,
    "items": [
      {
        "product_id": "prod_salty_caramel",
        "product_name": "Salty Caramel",
        "quantity": 2,
        "unit_price": 21000,
        "line_total": 42000,
        "availability": "available",
        "modifiers": [
          {
            "name": "Ice Level",
            "option_name": "Less Ice",
            "price_delta": 0
          }
        ]
      }
    ]
  },
  "warnings": []
}
```

### Response Invalid

```json
{
  "valid": false,
  "errors": [
    {
      "code": "PRODUCT_UNAVAILABLE",
      "product_id": "prod_salty_caramel",
      "message": "Salty Caramel sedang tidak tersedia di outlet ini."
    }
  ],
  "cart_snapshot": {
    "currency": "IDR",
    "subtotal_amount": 0,
    "total_amount": 0,
    "items": []
  }
}
```

### Backend Validation Wajib

```txt
Outlet valid
QR session valid jika channel qr_store
Product tersedia di outlet tersebut
Modifier valid
Quantity valid
Harga dihitung ulang backend
Total dari frontend diabaikan
```

---

# 4. Checkout API

Checkout harus membuat:

```txt
Order
Order items snapshot
Payment record
Payment URL
Public order token
```

---

## 4.1 Create Checkout

```http
POST /api/v1/public/checkout
```

### Headers

```http
Idempotency-Key: checkout_8f7a2b4d
```

### Request

```json
{
  "channel": "qr_store",
  "storefront_slug": "selkop",
  "outlet_id": "outlet_smd",
  "qr_session_token": "qrs_public_token_abc",
  "fulfillment_type": "dine_in",
  "customer": {
    "name": "Rido",
    "phone": "6281234567890"
  },
  "items": [
    {
      "product_id": "prod_salty_caramel",
      "quantity": 2,
      "modifiers": [
        {
          "modifier_group_id": "mg_ice",
          "option_id": "ice_less"
        }
      ],
      "note": "Less sweet"
    }
  ],
  "customer_note": "Jangan terlalu manis"
}
```

### Response

```json
{
  "order": {
    "id": "ord_001",
    "order_number": "SKP-20260706-001",
    "public_order_token": "pub_ord_x9f8a7",
    "channel": "qr_store",
    "outlet_id": "outlet_smd",
    "fulfillment_type": "dine_in",
    "payment_status": "pending",
    "fulfillment_status": "not_started",
    "public_order_status": "payment_pending",
    "total_amount": 42000,
    "currency": "IDR",
    "created_at": "2026-07-06T13:00:00.000Z"
  },
  "payment": {
    "id": "pay_001",
    "provider": "BayarGG",
    "status": "pending",
    "payment_url": "https://payment.example/abc",
    "expires_at": "2026-07-06T13:15:00.000Z",
    "amount": 42000
  },
  "next": {
    "payment_pending_url": "/payment/pending/pay_001",
    "public_order_url": "/order/pub_ord_x9f8a7"
  }
}
```

---

## 4.2 Checkout Error Cases

### QR Outlet Mismatch

```json
{
  "error": {
    "code": "QR_OUTLET_MISMATCH",
    "message": "QR ini hanya berlaku untuk SELKOP Samarinda."
  }
}
```

### Outlet Closed

```json
{
  "error": {
    "code": "OUTLET_CLOSED",
    "message": "Outlet sedang tutup. Silakan pesan saat outlet buka kembali."
  }
}
```

### Duplicate Checkout

```json
{
  "error": {
    "code": "DUPLICATE_CHECKOUT",
    "message": "Pesanan ini sudah dibuat sebelumnya.",
    "existing_order": {
      "public_order_token": "pub_ord_x9f8a7",
      "payment_url": "https://payment.example/abc"
    }
  }
}
```

---

# 5. Payment API

Frontend tidak boleh menentukan paid. Frontend hanya membaca status dari backend.

---

## 5.1 Get Payment Status

```http
GET /api/v1/public/payments/:paymentId/status
```

### Response Pending

```json
{
  "payment": {
    "id": "pay_001",
    "status": "pending",
    "amount": 42000,
    "currency": "IDR",
    "expires_at": "2026-07-06T13:15:00.000Z",
    "payment_url": "https://payment.example/abc"
  },
  "order": {
    "public_order_token": "pub_ord_x9f8a7",
    "public_order_status": "payment_pending"
  }
}
```

### Response Paid

```json
{
  "payment": {
    "id": "pay_001",
    "status": "paid",
    "amount": 42000,
    "currency": "IDR",
    "paid_at": "2026-07-06T13:04:00.000Z"
  },
  "order": {
    "public_order_token": "pub_ord_x9f8a7",
    "public_order_status": "order_received"
  }
}
```

### Rules

```txt
Frontend boleh polling.
Frontend boleh menampilkan timer.
Frontend tidak boleh mengubah status.
Paid hanya muncul kalau backend sudah menerima webhook/provider confirmation.
```

---

# 6. Public Order Status API

Untuk customer melihat status order.

```http
GET /api/v1/public/orders/:publicOrderToken
```

### Response

```json
{
  "order": {
    "order_number": "SKP-20260706-001",
    "channel": "qr_store",
    "public_order_status": "preparing",
    "payment_status": "paid",
    "fulfillment_status": "preparing",
    "fulfillment_type": "dine_in",
    "created_at": "2026-07-06T13:00:00.000Z",
    "customer": {
      "name": "Rido"
    },
    "outlet": {
      "name": "SELKOP Samarinda",
      "address": "Jl. Example Samarinda"
    },
    "qr_context": {
      "location_label": "Meja 07"
    },
    "items": [
      {
        "name": "Salty Caramel",
        "quantity": 2,
        "modifiers": [
          "Less Ice"
        ],
        "line_total": 42000
      }
    ],
    "amounts": {
      "subtotal_amount": 42000,
      "discount_amount": 0,
      "service_fee_amount": 0,
      "tax_amount": 0,
      "total_amount": 42000,
      "currency": "IDR"
    },
    "timeline": [
      {
        "status": "payment_pending",
        "label": "Menunggu Pembayaran",
        "completed": true,
        "timestamp": "2026-07-06T13:00:00.000Z"
      },
      {
        "status": "order_received",
        "label": "Pesanan Diterima",
        "completed": true,
        "timestamp": "2026-07-06T13:04:00.000Z"
      },
      {
        "status": "preparing",
        "label": "Pesanan Sedang Dibuat",
        "completed": true,
        "timestamp": "2026-07-06T13:07:00.000Z"
      }
    ]
  }
}
```

### Security Rule

Public order response tidak boleh mengembalikan:

```txt
Internal database ID sensitif
Staff notes
Admin user ID
Full phone number jika tidak perlu
Payment provider raw payload
Audit log internal
```

---

# 7. Admin Orders API

Untuk dashboard staff/admin yang mengelola online/QR order.

---

## 7.1 List Online/QR Orders

```http
GET /api/v1/admin/orders
```

### Query Params

```http
?channel=qr_store
&outlet_id=outlet_smd
&payment_status=paid
&fulfillment_status=preparing
&date_from=2026-07-06
&date_to=2026-07-06
&page=1
&limit=20
```

### Response

```json
{
  "data": [
    {
      "id": "ord_001",
      "order_number": "SKP-20260706-001",
      "channel": "qr_store",
      "outlet": {
        "id": "outlet_smd",
        "name": "SELKOP Samarinda"
      },
      "qr_context": {
        "location_label": "Meja 07"
      },
      "customer": {
        "name": "Rido",
        "phone": "6281234567890"
      },
      "payment_status": "paid",
      "fulfillment_status": "preparing",
      "fulfillment_type": "dine_in",
      "total_amount": 42000,
      "created_at": "2026-07-06T13:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

---

## 7.2 Get Admin Order Detail

```http
GET /api/v1/admin/orders/:orderId
```

### Response

```json
{
  "order": {
    "id": "ord_001",
    "order_number": "SKP-20260706-001",
    "channel": "qr_store",
    "outlet": {
      "id": "outlet_smd",
      "name": "SELKOP Samarinda",
      "address": "Jl. Example Samarinda"
    },
    "qr_context": {
      "qr_code_id": "qr_001",
      "location_type": "table",
      "location_label": "Meja 07"
    },
    "customer": {
      "name": "Rido",
      "phone": "6281234567890"
    },
    "payment": {
      "id": "pay_001",
      "provider": "BayarGG",
      "status": "paid",
      "amount": 42000,
      "paid_at": "2026-07-06T13:04:00.000Z"
    },
    "payment_status": "paid",
    "fulfillment_status": "preparing",
    "fulfillment_type": "dine_in",
    "items": [
      {
        "name": "Salty Caramel",
        "quantity": 2,
        "modifiers": [
          "Less Ice"
        ],
        "note": "Less sweet",
        "line_total": 42000
      }
    ],
    "customer_note": "Jangan terlalu manis",
    "status_history": [],
    "allowed_actions": [
      "mark_ready",
      "cancel_order"
    ]
  }
}
```

### Penting

Backend sebaiknya mengirim `allowed_actions`.

Jadi frontend tidak perlu menebak sendiri.

Contoh:

```json
"allowed_actions": [
  "accept_order",
  "mark_preparing",
  "mark_ready",
  "mark_completed",
  "cancel_order"
]
```

Kalau payment belum paid:

```json
"allowed_actions": []
```

atau:

```json
"allowed_actions": [
  "cancel_order"
]
```

---

# 8. Admin Status Transition API

Jangan pakai PATCH bebas ke `status`. Pakai endpoint transition yang jelas.

---

## 8.1 Accept Order

```http
POST /api/v1/admin/orders/:orderId/accept
```

### Response

```json
{
  "order": {
    "id": "ord_001",
    "payment_status": "paid",
    "fulfillment_status": "accepted",
    "public_order_status": "accepted"
  }
}
```

### Backend Rule

```txt
payment_status harus paid
fulfillment_status harus awaiting_acceptance / not_started
admin harus punya permission order.accept
```

---

## 8.2 Mark Preparing

```http
POST /api/v1/admin/orders/:orderId/prepare
```

### Backend Rule

```txt
payment_status harus paid
fulfillment_status harus accepted
admin harus punya permission order.prepare
```

---

## 8.3 Mark Ready

```http
POST /api/v1/admin/orders/:orderId/ready
```

### Backend Rule

```txt
payment_status harus paid
fulfillment_status harus preparing
admin harus punya permission order.ready
```

---

## 8.4 Complete Order

```http
POST /api/v1/admin/orders/:orderId/complete
```

### Backend Rule

```txt
payment_status harus paid
fulfillment_status harus ready
admin harus punya permission order.complete
```

---

## 8.5 Cancel Order

```http
POST /api/v1/admin/orders/:orderId/cancel
```

### Request

```json
{
  "reason": "Customer requested cancellation",
  "note": "Customer called outlet and asked to cancel"
}
```

### Response

```json
{
  "order": {
    "id": "ord_001",
    "fulfillment_status": "cancelled",
    "public_order_status": "cancelled"
  }
}
```

### Backend Rule

```txt
reason wajib
delete order tidak boleh untuk flow operasional
cancel harus masuk audit log
kalau sudah paid, refund flow harus dipertimbangkan
```

---

# 9. Payment Webhook API

Ini endpoint dari payment provider. Provider ada beberapa dan itu sesuai dengan yang dipilih saat ini testing menggunakan bayarGG

```http
POST /api/v1/webhooks/payments/bayargg

### Backend Responsibilities

```txt
Verify webhook signature
Find payment by provider reference
Validate amount
Validate currency
Validate order id
Update payment_status
Update payment_status_history
If paid:
  set order.payment_status = paid
  set order.fulfillment_status = awaiting_acceptance
  set public_order_status = order_received
Create audit log / event log
Return 200 only after processing safely
```

### Important Rule

Frontend tidak boleh memanggil endpoint ini.

---

# 10. Standard Error Format

Pakai format error konsisten.

```json
{
  "error": {
    "code": "PRODUCT_UNAVAILABLE",
    "message": "Produk sedang tidak tersedia di outlet ini.",
    "details": {
      "product_id": "prod_salty_caramel"
    }
  }
}
```

## Error Codes Minimal

```txt
STORE_NOT_FOUND
STORE_INACTIVE
OUTLET_NOT_FOUND
OUTLET_CLOSED
OUTLET_UNAVAILABLE
QR_INVALID
QR_EXPIRED
QR_OUTLET_MISMATCH
MENU_UNAVAILABLE
PRODUCT_UNAVAILABLE
MODIFIER_INVALID
CART_INVALID
CHECKOUT_DUPLICATE
PAYMENT_NOT_FOUND
PAYMENT_EXPIRED
ORDER_NOT_FOUND
ORDER_ACCESS_DENIED
INVALID_STATUS_TRANSITION
PAYMENT_REQUIRED
PERMISSION_DENIED
RATE_LIMITED
INTERNAL_ERROR
```

---

# 11. Idempotency Rules

Wajib untuk checkout.

## Header

```http
Idempotency-Key: checkout_unique_key_from_client
```

## Backend Behavior

| Kondisi                 | Response                        |
| ----------------------- | ------------------------------- |
| Key baru                | Buat order baru                 |
| Key sama + payload sama | Return order/payment lama       |
| Key sama + payload beda | Return error                    |
| Key expired             | Boleh proses baru sesuai policy |

### Error payload beda

```json
{
  "error": {
    "code": "IDEMPOTENCY_KEY_CONFLICT",
    "message": "Request checkout berbeda dengan request sebelumnya."
  }
}
```

---

# 12. Minimal API untuk Alpha Testing

Untuk alpha, jangan kebanyakan endpoint dulu. Minimal cukup ini:

## Customer

```http
GET  /api/v1/public/stores/:storefrontSlug
GET  /api/v1/public/qr/:qrToken
POST /api/v1/public/carts/validate
POST /api/v1/public/checkout
GET  /api/v1/public/payments/:paymentId/status
GET  /api/v1/public/orders/:publicOrderToken
```

## Admin

```http
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:orderId
POST /api/v1/admin/orders/:orderId/accept
POST /api/v1/admin/orders/:orderId/prepare
POST /api/v1/admin/orders/:orderId/ready
POST /api/v1/admin/orders/:orderId/complete
POST /api/v1/admin/orders/:orderId/cancel
```

## Webhook

```http
POST /api/v1/webhooks/payments/bayarGG

---

# 13. Frontend Contract Changes

Frontend harus menyesuaikan audit dengan contract ini.

## Customer UI

```txt
PaymentPendingPage tidak boleh auto paid
OrderStatusPage copy harus status-aware
CheckoutPage harus call cart validation
QR route harus pakai qrToken / qrSession
Outlet locked jika QR
Cart clear/lock setelah checkout success
```

## Admin UI

```txt
OrderQuickActions pakai allowed_actions dari backend
Payment badge dan fulfillment badge dipisah
Delete diganti cancel + reason
QR/table context tampil
Missing outlet tidak fallback Samarinda
Loading/error state jelas
```

---

# 14. Recommended Route Design di Frontend

## Public Routes

```txt
/store/:storefrontSlug
/qr/:qrToken
/payment/pending/:paymentId
/order/:publicOrderToken
```

## Admin Routes

```txt
/admin/orders
/admin/orders/:orderId
```

Kalau UI kamu masih memakai drawer, route detail tetap bisa sync dengan query:

```txt
/admin/orders?id=ord_001
```

---

# 15. Keputusan yang perlu kamu kunci sebelum Phase 3

| Decision                | Rekomendasi                            |
| ----------------------- | -------------------------------------- |
| Base API version        | `/api/v1`                              |
| QR route                | `/qr/:qrToken`                         |
| Online store route      | `/store/:storefrontSlug`               |
| Checkout idempotency    | Wajib                                  |
| Cart backend            | Local cart + backend validation dulu   |
| Payment provider        | BayarGG sandbox untuk alpha             |
| Payment source of truth | Webhook/backend                        |
| Order status update     | Transition endpoint, bukan PATCH bebas |
| Admin delete order      | Tidak ada, pakai cancel                |
| Public order access     | `public_order_token`                   |
| Admin allowed actions   | Dihitung backend                       |

---

# Final Phase 2 Recommendation

Untuk alpha testing, backend API contract kamu cukup pakai:

```txt
Public:
storefront → QR validation → cart validation → checkout → payment status → public order status

Admin:
list orders → order detail → accept → prepare → ready → complete → cancel

Webhook:
payment provider → verify → update payment/order status
```

Yang paling penting:

```txt
Backend harus mengunci payment, QR outlet, total harga, dan status transition.
```

