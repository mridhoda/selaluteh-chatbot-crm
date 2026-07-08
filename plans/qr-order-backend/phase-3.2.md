Siap, Rido. Kita masuk ke **Phase 3.2 — Detail Table Schema v1** untuk **Online Store + QR Store + configurable payment provider** ☕🔥

Aku desain ini dengan asumsi kamu pakai **PostgreSQL/Supabase style**, tapi konsepnya tetap bisa dipakai di Mongo/Prisma/SQL lain.

---

# Phase 3.2 — Detail Table Schema v1

## Scope

Schema ini fokus untuk:

```txt
Online Store
QR Store
Multi-outlet
Menu / catalog
Cart validation
Checkout
Orders
Payment provider configurable
BayarGG active provider
Admin order management
Audit log
Alpha testing readiness
```

Belum fokus ke:

```txt
Full POS cashier
Loyalty
CRM besar
Delivery fleet
Finance/ERP
Advanced stock movement
```

---

# 0. Global Database Rules

## ID & Timestamp Standard

Semua tabel utama sebaiknya punya:

| Field        | Type                   | Catatan                      |
| ------------ | ---------------------- | ---------------------------- |
| `id`         | `uuid`                 | Primary key                  |
| `created_at` | `timestamptz`          | Default `now()`              |
| `updated_at` | `timestamptz`          | Update otomatis              |
| `deleted_at` | `timestamptz nullable` | Untuk soft delete jika perlu |

## Money Standard

Semua uang simpan sebagai integer minor unit:

```txt
Rp42.000 → 42000
```

Jangan pakai float.

| Field             | Type                       |
| ----------------- | -------------------------- |
| `subtotal_amount` | `integer`                  |
| `total_amount`    | `integer`                  |
| `currency`        | `varchar(3)` default `IDR` |

---

# A. Workspace / Brand Domain

## 1. `workspaces`

Root bisnis/account.

| Field        | Type          | Notes                |
| ------------ | ------------- | -------------------- |
| `id`         | `uuid`        | PK                   |
| `name`       | `text`        | Contoh: `Foodinesia` |
| `slug`       | `text`        | Unique               |
| `status`     | `text`        | `active`, `inactive` |
| `created_at` | `timestamptz` |                      |
| `updated_at` | `timestamptz` |                      |

### Constraint

```txt
unique(slug)
```

---

## 2. `brands`

Untuk nanti kalau satu workspace punya banyak brand: SELKOP, SelaluTeh, dll.

| Field          | Type            | Notes                     |
| -------------- | --------------- | ------------------------- |
| `id`           | `uuid`          | PK                        |
| `workspace_id` | `uuid`          | FK → `workspaces.id`      |
| `name`         | `text`          | `SELKOP`                  |
| `slug`         | `text`          | `selkop`                  |
| `brandline`    | `text`          | `Born Local For Everyone` |
| `logo_url`     | `text nullable` |                           |
| `status`       | `text`          | `active`, `inactive`      |
| `created_at`   | `timestamptz`   |                           |
| `updated_at`   | `timestamptz`   |                           |

### Constraint

```txt
unique(workspace_id, slug)
```

---

## 3. `workspace_settings`

Untuk setting global non-payment.

| Field          | Type            | Notes                      |
| -------------- | --------------- | -------------------------- |
| `id`           | `uuid`          | PK                         |
| `workspace_id` | `uuid`          | FK                         |
| `key`          | `text`          | Contoh: `default_currency` |
| `value_json`   | `jsonb`         | Flexible config            |
| `updated_by`   | `uuid nullable` | FK admin jika ada          |
| `created_at`   | `timestamptz`   |                            |
| `updated_at`   | `timestamptz`   |                            |

### Constraint

```txt
unique(workspace_id, key)
```

---

# B. Outlet & QR Domain

## 4. `outlets`

Outlet fisik.

| Field                | Type             | Notes                     |
| -------------------- | ---------------- | ------------------------- |
| `id`                 | `uuid`           | PK                        |
| `workspace_id`       | `uuid`           | FK                        |
| `brand_id`           | `uuid nullable`  | FK                        |
| `name`               | `text`           | `SELKOP Samarinda`        |
| `slug`               | `text`           | `selkop-samarinda`        |
| `code`               | `text`           | Short code, contoh `SMD`  |
| `address`            | `text`           |                           |
| `city`               | `text nullable`  |                           |
| `timezone`           | `text`           | Default `Asia/Makassar`   |
| `is_active`          | `boolean`        | Outlet aktif atau tidak   |
| `is_open`            | `boolean`        | Status operasional manual |
| `ordering_enabled`   | `boolean`        | Bisa menerima order       |
| `pickup_enabled`     | `boolean`        |                           |
| `dine_in_enabled`    | `boolean`        |                           |
| `takeaway_enabled`   | `boolean`        |                           |
| `opening_hours_json` | `jsonb nullable` | Jam buka                  |
| `created_at`         | `timestamptz`    |                           |
| `updated_at`         | `timestamptz`    |                           |

### Constraint

```txt
unique(workspace_id, slug)
unique(workspace_id, code)
```

---

## 5. `qr_locations`

Lokasi QR di dalam outlet.

Contoh:

```txt
Meja 01
Meja 02
Pickup Counter
Takeaway Counter
```

| Field                      | Type          | Notes                                                               |
| -------------------------- | ------------- | ------------------------------------------------------------------- |
| `id`                       | `uuid`        | PK                                                                  |
| `workspace_id`             | `uuid`        | FK                                                                  |
| `outlet_id`                | `uuid`        | FK → `outlets.id`                                                   |
| `type`                     | `text`        | `table`, `counter`, `pickup_area`, `takeaway_area`, `general_store` |
| `label`                    | `text`        | `Meja 07`                                                           |
| `code`                     | `text`        | `T07`                                                               |
| `default_fulfillment_type` | `text`        | `dine_in`, `takeaway`, `pickup`                                     |
| `is_active`                | `boolean`     |                                                                     |
| `sort_order`               | `integer`     |                                                                     |
| `created_at`               | `timestamptz` |                                                                     |
| `updated_at`               | `timestamptz` |                                                                     |

### Constraint

```txt
unique(outlet_id, code)
```

---

## 6. `qr_codes`

QR yang ditempel atau dibagikan.

| Field            | Type                   | Notes                                      |
| ---------------- | ---------------------- | ------------------------------------------ |
| `id`             | `uuid`                 | PK                                         |
| `workspace_id`   | `uuid`                 | FK                                         |
| `outlet_id`      | `uuid`                 | FK                                         |
| `qr_location_id` | `uuid nullable`        | FK                                         |
| `public_code`    | `text`                 | Token publik di URL                        |
| `status`         | `text`                 | `active`, `inactive`, `expired`, `revoked` |
| `outlet_locked`  | `boolean`              | Untuk QR store harus true                  |
| `expires_at`     | `timestamptz nullable` | Optional                                   |
| `revoked_at`     | `timestamptz nullable` |                                            |
| `revoked_reason` | `text nullable`        |                                            |
| `created_by`     | `uuid nullable`        | FK admin                                   |
| `created_at`     | `timestamptz`          |                                            |
| `updated_at`     | `timestamptz`          |                                            |

### Constraint

```txt
unique(public_code)
```

### Rule

```txt
QR store harus mengunci outlet.
Customer tidak boleh ganti outlet kalau outlet_locked = true.
```

---

## 7. `qr_sessions`

Session setelah customer scan QR.

| Field              | Type                   | Notes                                         |
| ------------------ | ---------------------- | --------------------------------------------- |
| `id`               | `uuid`                 | PK                                            |
| `workspace_id`     | `uuid`                 | FK                                            |
| `qr_code_id`       | `uuid`                 | FK                                            |
| `outlet_id`        | `uuid`                 | FK                                            |
| `qr_location_id`   | `uuid nullable`        | FK                                            |
| `session_token`    | `text`                 | Public session token                          |
| `status`           | `text`                 | `active`, `expired`, `completed`, `cancelled` |
| `fulfillment_type` | `text`                 | Dari QR location                              |
| `expires_at`       | `timestamptz`          |                                               |
| `completed_at`     | `timestamptz nullable` | Setelah order sukses                          |
| `ip_hash`          | `text nullable`        | Security                                      |
| `user_agent_hash`  | `text nullable`        | Security                                      |
| `created_at`       | `timestamptz`          |                                               |
| `updated_at`       | `timestamptz`          |                                               |

### Constraint

```txt
unique(session_token)
```

---

# C. Storefront Domain

## 8. `storefronts`

Public online store seperti `/store/selkop`.

| Field              | Type             | Notes                 |
| ------------------ | ---------------- | --------------------- |
| `id`               | `uuid`           | PK                    |
| `workspace_id`     | `uuid`           | FK                    |
| `brand_id`         | `uuid`           | FK                    |
| `slug`             | `text`           | `selkop`              |
| `name`             | `text`           | `SELKOP Online Store` |
| `is_active`        | `boolean`        |                       |
| `ordering_enabled` | `boolean`        |                       |
| `theme_json`       | `jsonb nullable` | Color/theme config    |
| `created_at`       | `timestamptz`    |                       |
| `updated_at`       | `timestamptz`    |                       |

### Constraint

```txt
unique(workspace_id, slug)
```

---

## 9. `storefront_outlets`

Outlet yang tersedia di storefront.

| Field           | Type          | Notes |
| --------------- | ------------- | ----- |
| `id`            | `uuid`        | PK    |
| `storefront_id` | `uuid`        | FK    |
| `outlet_id`     | `uuid`        | FK    |
| `is_visible`    | `boolean`     |       |
| `is_default`    | `boolean`     |       |
| `sort_order`    | `integer`     |       |
| `created_at`    | `timestamptz` |       |

### Constraint

```txt
unique(storefront_id, outlet_id)
```

---

## 10. `storefront_settings`

Optional, tapi bagus untuk setting khusus public store.

| Field           | Type          | Notes                                              |
| --------------- | ------------- | -------------------------------------------------- |
| `id`            | `uuid`        | PK                                                 |
| `storefront_id` | `uuid`        | FK                                                 |
| `key`           | `text`        | `show_outlet_selector`, `default_fulfillment_type` |
| `value_json`    | `jsonb`       |                                                    |
| `created_at`    | `timestamptz` |                                                    |
| `updated_at`    | `timestamptz` |                                                    |

---

# D. Catalog / Menu Domain

## 11. `product_categories`

| Field          | Type            | Notes                  |
| -------------- | --------------- | ---------------------- |
| `id`           | `uuid`          | PK                     |
| `workspace_id` | `uuid`          | FK                     |
| `brand_id`     | `uuid nullable` | FK                     |
| `name`         | `text`          | `Coffee`, `Non Coffee` |
| `slug`         | `text`          |                        |
| `description`  | `text nullable` |                        |
| `is_active`    | `boolean`       |                        |
| `sort_order`   | `integer`       |                        |
| `created_at`   | `timestamptz`   |                        |
| `updated_at`   | `timestamptz`   |                        |

### Constraint

```txt
unique(workspace_id, slug)
```

---

## 12. `products`

| Field               | Type            | Notes                 |
| ------------------- | --------------- | --------------------- |
| `id`                | `uuid`          | PK                    |
| `workspace_id`      | `uuid`          | FK                    |
| `brand_id`          | `uuid nullable` | FK                    |
| `category_id`       | `uuid`          | FK                    |
| `name`              | `text`          | `Salty Caramel`       |
| `slug`              | `text`          |                       |
| `description`       | `text nullable` |                       |
| `base_price_amount` | `integer`       |                       |
| `currency`          | `varchar(3)`    | Default `IDR`         |
| `image_url`         | `text nullable` | Untuk alpha cukup ini |
| `is_active`         | `boolean`       |                       |
| `is_featured`       | `boolean`       |                       |
| `sort_order`        | `integer`       |                       |
| `created_at`        | `timestamptz`   |                       |
| `updated_at`        | `timestamptz`   |                       |

### Constraint

```txt
unique(workspace_id, slug)
```

---

## 13. `modifier_groups`

Contoh: Ice Level, Sweetness, Add-ons.

| Field            | Type          | Notes                |
| ---------------- | ------------- | -------------------- |
| `id`             | `uuid`        | PK                   |
| `workspace_id`   | `uuid`        | FK                   |
| `name`           | `text`        | `Ice Level`          |
| `code`           | `text`        | `ice_level`          |
| `selection_type` | `text`        | `single`, `multiple` |
| `min_select`     | `integer`     |                      |
| `max_select`     | `integer`     |                      |
| `is_required`    | `boolean`     |                      |
| `is_active`      | `boolean`     |                      |
| `sort_order`     | `integer`     |                      |
| `created_at`     | `timestamptz` |                      |
| `updated_at`     | `timestamptz` |                      |

---

## 14. `modifier_options`

| Field                | Type          | Notes      |
| -------------------- | ------------- | ---------- |
| `id`                 | `uuid`        | PK         |
| `modifier_group_id`  | `uuid`        | FK         |
| `name`               | `text`        | `Less Ice` |
| `code`               | `text`        | `less_ice` |
| `price_delta_amount` | `integer`     | Bisa 0     |
| `is_default`         | `boolean`     |            |
| `is_active`          | `boolean`     |            |
| `sort_order`         | `integer`     |            |
| `created_at`         | `timestamptz` |            |
| `updated_at`         | `timestamptz` |            |

### Constraint

```txt
unique(modifier_group_id, code)
```

---

## 15. `product_modifier_groups`

Relasi produk ke modifier group.

| Field                  | Type               | Notes    |
| ---------------------- | ------------------ | -------- |
| `id`                   | `uuid`             | PK       |
| `product_id`           | `uuid`             | FK       |
| `modifier_group_id`    | `uuid`             | FK       |
| `is_required_override` | `boolean nullable` | Optional |
| `min_select_override`  | `integer nullable` | Optional |
| `max_select_override`  | `integer nullable` | Optional |
| `sort_order`           | `integer`          |          |
| `created_at`           | `timestamptz`      |          |

### Constraint

```txt
unique(product_id, modifier_group_id)
```

---

## 16. `product_availability`

Availability per outlet.

| Field               | Type                   | Notes    |
| ------------------- | ---------------------- | -------- |
| `id`                | `uuid`                 | PK       |
| `product_id`        | `uuid`                 | FK       |
| `outlet_id`         | `uuid`                 | FK       |
| `is_available`      | `boolean`              |          |
| `sold_out_until`    | `timestamptz nullable` |          |
| `availability_note` | `text nullable`        |          |
| `updated_by`        | `uuid nullable`        | FK admin |
| `created_at`        | `timestamptz`          |          |
| `updated_at`        | `timestamptz`          |          |

### Constraint

```txt
unique(product_id, outlet_id)
```

---

# E. Checkout / Idempotency Domain

## 17. `checkout_sessions`

Snapshot sebelum order dibuat.

| Field                | Type            | Notes                                                  |
| -------------------- | --------------- | ------------------------------------------------------ |
| `id`                 | `uuid`          | PK                                                     |
| `workspace_id`       | `uuid`          | FK                                                     |
| `storefront_id`      | `uuid nullable` | FK                                                     |
| `outlet_id`          | `uuid`          | FK                                                     |
| `qr_session_id`      | `uuid nullable` | FK                                                     |
| `channel`            | `text`          | `online_store`, `qr_store`                             |
| `fulfillment_type`   | `text`          |                                                        |
| `customer_name`      | `text`          |                                                        |
| `customer_phone`     | `text`          |                                                        |
| `customer_note`      | `text nullable` |                                                        |
| `status`             | `text`          | `draft`, `validated`, `converted`, `expired`, `failed` |
| `cart_hash`          | `text`          | Hash cart payload                                      |
| `subtotal_amount`    | `integer`       | Backend calculated                                     |
| `discount_amount`    | `integer`       |                                                        |
| `service_fee_amount` | `integer`       |                                                        |
| `tax_amount`         | `integer`       |                                                        |
| `total_amount`       | `integer`       |                                                        |
| `currency`           | `varchar(3)`    | `IDR`                                                  |
| `converted_order_id` | `uuid nullable` | FK orders                                              |
| `expires_at`         | `timestamptz`   |                                                        |
| `created_at`         | `timestamptz`   |                                                        |
| `updated_at`         | `timestamptz`   |                                                        |

---

## 18. `checkout_items`

| Field                     | Type            | Notes                     |
| ------------------------- | --------------- | ------------------------- |
| `id`                      | `uuid`          | PK                        |
| `checkout_session_id`     | `uuid`          | FK                        |
| `product_id`              | `uuid`          | FK                        |
| `product_snapshot_json`   | `jsonb`         | Nama, harga saat checkout |
| `quantity`                | `integer`       |                           |
| `unit_price_amount`       | `integer`       |                           |
| `modifier_total_amount`   | `integer`       |                           |
| `line_total_amount`       | `integer`       |                           |
| `modifiers_snapshot_json` | `jsonb`         | Modifier pilihan          |
| `note`                    | `text nullable` |                           |
| `created_at`              | `timestamptz`   |                           |

---

## 19. `idempotency_keys`

Untuk mencegah double checkout.

| Field           | Type             | Notes                               |
| --------------- | ---------------- | ----------------------------------- |
| `id`            | `uuid`           | PK                                  |
| `workspace_id`  | `uuid`           | FK                                  |
| `key`           | `text`           | Dari header `Idempotency-Key`       |
| `request_hash`  | `text`           | Hash payload checkout               |
| `response_json` | `jsonb nullable` | Response pertama                    |
| `resource_type` | `text`           | `checkout`, `payment`               |
| `resource_id`   | `uuid nullable`  | Order/payment/session               |
| `status`        | `text`           | `processing`, `completed`, `failed` |
| `expires_at`    | `timestamptz`    |                                     |
| `created_at`    | `timestamptz`    |                                     |
| `updated_at`    | `timestamptz`    |                                     |

### Constraint

```txt
unique(workspace_id, key)
```

---

# F. Orders Domain

## 20. `orders`

| Field                 | Type                   | Notes                           |
| --------------------- | ---------------------- | ------------------------------- |
| `id`                  | `uuid`                 | PK                              |
| `workspace_id`        | `uuid`                 | FK                              |
| `brand_id`            | `uuid nullable`        | FK                              |
| `storefront_id`       | `uuid nullable`        | FK                              |
| `outlet_id`           | `uuid`                 | FK                              |
| `qr_session_id`       | `uuid nullable`        | FK                              |
| `qr_location_id`      | `uuid nullable`        | FK                              |
| `checkout_session_id` | `uuid nullable`        | FK                              |
| `order_number`        | `text`                 | Human-readable                  |
| `public_order_token`  | `text`                 | Untuk customer status page      |
| `channel`             | `text`                 | `online_store`, `qr_store`      |
| `fulfillment_type`    | `text`                 | `pickup`, `dine_in`, `takeaway` |
| `payment_status`      | `text`                 |                                 |
| `fulfillment_status`  | `text`                 |                                 |
| `public_order_status` | `text`                 |                                 |
| `customer_name`       | `text`                 |                                 |
| `customer_phone`      | `text`                 |                                 |
| `customer_note`       | `text nullable`        |                                 |
| `internal_note`       | `text nullable`        | Staff only                      |
| `subtotal_amount`     | `integer`              |                                 |
| `discount_amount`     | `integer`              |                                 |
| `service_fee_amount`  | `integer`              |                                 |
| `tax_amount`          | `integer`              |                                 |
| `total_amount`        | `integer`              |                                 |
| `currency`            | `varchar(3)`           | `IDR`                           |
| `accepted_at`         | `timestamptz nullable` |                                 |
| `preparing_at`        | `timestamptz nullable` |                                 |
| `ready_at`            | `timestamptz nullable` |                                 |
| `completed_at`        | `timestamptz nullable` |                                 |
| `cancelled_at`        | `timestamptz nullable` |                                 |
| `cancel_reason`       | `text nullable`        |                                 |
| `created_at`          | `timestamptz`          |                                 |
| `updated_at`          | `timestamptz`          |                                 |

### Constraint

```txt
unique(workspace_id, order_number)
unique(public_order_token)
```

### Rule

```txt
payment_status = paid
baru fulfillment_status boleh accepted / preparing / ready / completed.
```

Rule ini lebih aman ditegakkan di service layer, bukan hanya DB constraint.

---

## 21. `order_items`

Snapshot item saat order dibuat.

| Field                   | Type            | Notes                                                        |
| ----------------------- | --------------- | ------------------------------------------------------------ |
| `id`                    | `uuid`          | PK                                                           |
| `order_id`              | `uuid`          | FK                                                           |
| `product_id`            | `uuid nullable` | Boleh nullable agar snapshot tetap aman jika product dihapus |
| `product_name`          | `text`          | Snapshot                                                     |
| `product_description`   | `text nullable` | Snapshot                                                     |
| `quantity`              | `integer`       |                                                              |
| `unit_price_amount`     | `integer`       |                                                              |
| `modifier_total_amount` | `integer`       |                                                              |
| `line_total_amount`     | `integer`       |                                                              |
| `note`                  | `text nullable` |                                                              |
| `created_at`            | `timestamptz`   |                                                              |

---

## 22. `order_item_modifiers`

Snapshot modifier pilihan customer.

| Field                | Type            | Notes    |
| -------------------- | --------------- | -------- |
| `id`                 | `uuid`          | PK       |
| `order_item_id`      | `uuid`          | FK       |
| `modifier_group_id`  | `uuid nullable` |          |
| `modifier_option_id` | `uuid nullable` |          |
| `group_name`         | `text`          | Snapshot |
| `option_name`        | `text`          | Snapshot |
| `price_delta_amount` | `integer`       |          |
| `created_at`         | `timestamptz`   |          |

---

## 23. `order_status_history`

History perubahan status fulfillment/public.

| Field                      | Type             | Notes                                      |
| -------------------------- | ---------------- | ------------------------------------------ |
| `id`                       | `uuid`           | PK                                         |
| `order_id`                 | `uuid`           | FK                                         |
| `from_fulfillment_status`  | `text nullable`  |                                            |
| `to_fulfillment_status`    | `text nullable`  |                                            |
| `from_public_order_status` | `text nullable`  |                                            |
| `to_public_order_status`   | `text nullable`  |                                            |
| `actor_type`               | `text`           | `admin_user`, `system`, `payment_provider` |
| `actor_id`                 | `uuid nullable`  |                                            |
| `reason`                   | `text nullable`  | Wajib untuk cancel                         |
| `metadata_json`            | `jsonb nullable` |                                            |
| `created_at`               | `timestamptz`    |                                            |

---

# G. Payment Domain

## 24. `payment_providers`

Master provider.

| Field              | Type          | Notes                           |
| ------------------ | ------------- | ------------------------------- |
| `id`               | `uuid`        | PK                              |
| `code`             | `text`        | `bayargg`, `xendit`, `midtrans` |
| `name`             | `text`        | `BayarGG`                       |
| `is_enabled`       | `boolean`     | Provider tersedia di sistem     |
| `supports_qris`    | `boolean`     |                                 |
| `supports_va`      | `boolean`     |                                 |
| `supports_ewallet` | `boolean`     |                                 |
| `supports_card`    | `boolean`     |                                 |
| `created_at`       | `timestamptz` |                                 |
| `updated_at`       | `timestamptz` |                                 |

### Constraint

```txt
unique(code)
```

### Seed awal

```txt
bayargg = enabled
xendit = disabled
midtrans = disabled
manual_transfer = disabled/optional
```

---

## 25. `payment_provider_settings`

Provider aktif dari Settings.

| Field                    | Type             | Notes                          |
| ------------------------ | ---------------- | ------------------------------ |
| `id`                     | `uuid`           | PK                             |
| `workspace_id`           | `uuid`           | FK                             |
| `provider_id`            | `uuid`           | FK                             |
| `is_active`              | `boolean`        | Provider aktif saat ini        |
| `mode`                   | `text`           | `sandbox`, `production`        |
| `display_name`           | `text nullable`  |                                |
| `public_key`             | `text nullable`  | Jika provider butuh            |
| `secret_key_ref`         | `text nullable`  | Reference, bukan secret mentah |
| `webhook_secret_ref`     | `text nullable`  | Reference                      |
| `callback_url`           | `text nullable`  |                                |
| `webhook_url`            | `text nullable`  |                                |
| `payment_expiry_minutes` | `integer`        | Default 15                     |
| `config_json`            | `jsonb nullable` | Provider-specific config       |
| `created_by`             | `uuid nullable`  | FK admin                       |
| `updated_by`             | `uuid nullable`  | FK admin                       |
| `created_at`             | `timestamptz`    |                                |
| `updated_at`             | `timestamptz`    |                                |

### Important Rule

```txt
Hanya boleh ada satu active provider per workspace per mode.
```

Untuk alpha:

```txt
workspace: SELKOP
provider: BayarGG
mode: sandbox
is_active: true
```

---

## 26. `payments`

Payment record per order.

| Field                 | Type                   | Notes                                  |                              |
| --------------------- | ---------------------- | -------------------------------------- | ---------------------------- |
| `id`                  | `uuid`                 | PK                                     |                              |
| `workspace_id`        | `uuid`                 | FK                                     |                              |
| `order_id`            | `uuid`                 | FK                                     |                              |
| `provider_id`         | `uuid`                 | FK                                     |                              |
| `provider_setting_id` | `uuid`                 | FK                                     |                              |
| `provider_payment_id` | `text nullable`        | ID dari BayarGG/provider               |                              |
| `provider_reference`  | `text nullable`        | ID dari BayarGG/providertext nullable` | Reference unik dari provider |
| `status`              | `text`                 | `pending`, `paid`, etc                 |                              |
| `method_type`         | `text nullable`        | `qris`, `ewallet`, etc                 |                              |
| `amount`              | `integer`              |                                        |                              |
| `currency`            | `varchar(3)`           | `IDR`                                  |                              |
| `payment_url`         | `text nullable`        | URL bayar                              |                              |
| `qr_string`           | `text nullable`        | Kalau QRIS string                      |                              |
| `raw_status`          | `text nullable`        | Status asli provider                   |                              |
| `metadata_json`       | `jsonb nullable`       | Provider-specific metadata             |                              |
| `expires_at`          | `timestamptz nullable` |                                        |                              |
| `paid_at`             | `timestamptz nullable` |                                        |                              |
| `failed_at`           | `timestamptz nullable` |                                        |                              |
| `expired_at`          | `timestamptz nullable` |                                        |                              |
| `created_at`          | `timestamptz`          |                                        |                              |
| `updated_at`          | `timestamptz`          |                                        |                              |

### Constraint

```txt
unique(provider_id, provider_reference)
```

Jika provider_reference bisa null, atur partial unique index nanti di Phase 3.3.

---

## 27. `payment_status_history`

| Field               | Type             | Notes                                      |
| ------------------- | ---------------- | ------------------------------------------ |
| `id`                | `uuid`           | PK                                         |
| `payment_id`        | `uuid`           | FK                                         |
| `order_id`          | `uuid`           | FK                                         |
| `from_status`       | `text nullable`  |                                            |
| `to_status`         | `text`           |                                            |
| `actor_type`        | `text`           | `payment_provider`, `system`, `admin_user` |
| `actor_id`          | `uuid nullable`  |                                            |
| `provider_event_id` | `text nullable`  |                                            |
| `reason`            | `text nullable`  |                                            |
| `metadata_json`     | `jsonb nullable` |                                            |
| `created_at`        | `timestamptz`    |                                            |

---

## 28. `payment_webhook_events`

Mencatat webhook/callback dari provider.

| Field               | Type                   | Notes                                        |
| ------------------- | ---------------------- | -------------------------------------------- |
| `id`                | `uuid`                 | PK                                           |
| `workspace_id`      | `uuid`                 | FK                                           |
| `provider_id`       | `uuid`                 | FK                                           |
| `payment_id`        | `uuid nullable`        | FK setelah matched                           |
| `provider_event_id` | `text nullable`        |                                              |
| `event_type`        | `text nullable`        |                                              |
| `signature_valid`   | `boolean`              |                                              |
| `payload_hash`      | `text`                 |                                              |
| `raw_payload_ref`   | `text nullable`        | Storage/log reference                        |
| `processing_status` | `text`                 | `received`, `processed`, `failed`, `ignored` |
| `error_message`     | `text nullable`        |                                              |
| `received_at`       | `timestamptz`          |                                              |
| `processed_at`      | `timestamptz nullable` |                                              |
| `created_at`        | `timestamptz`          |                                              |

### Rule

```txt
Webhook BayarGG harus diverifikasi sebelum mengubah payment_status.
```

---

# H. Admin / Roles / Permissions

## 29. `admin_users`

| Field           | Type                   | Notes                             |
| --------------- | ---------------------- | --------------------------------- |
| `id`            | `uuid`                 | PK                                |
| `workspace_id`  | `uuid`                 | FK                                |
| `name`          | `text`                 |                                   |
| `email`         | `text`                 |                                   |
| `phone`         | `text nullable`        |                                   |
| `password_hash` | `text nullable`        | Kalau auth internal               |
| `status`        | `text`                 | `active`, `inactive`, `suspended` |
| `last_login_at` | `timestamptz nullable` |                                   |
| `created_at`    | `timestamptz`          |                                   |
| `updated_at`    | `timestamptz`          |                                   |

### Constraint

```txt
unique(workspace_id, email)
```

---

## 30. `roles`

| Field          | Type            | Notes                       |
| -------------- | --------------- | --------------------------- |
| `id`           | `uuid`          | PK                          |
| `workspace_id` | `uuid`          | FK                          |
| `name`         | `text`          | `Owner`, `Manager`, `Staff` |
| `code`         | `text`          | `owner`, `manager`, `staff` |
| `description`  | `text nullable` |                             |
| `created_at`   | `timestamptz`   |                             |
| `updated_at`   | `timestamptz`   |                             |

### Constraint

```txt
unique(workspace_id, code)
```

---

## 31. `permissions`

| Field         | Type            | Notes           |
| ------------- | --------------- | --------------- |
| `id`          | `uuid`          | PK              |
| `key`         | `text`          | `orders.accept` |
| `description` | `text nullable` |                 |
| `created_at`  | `timestamptz`   |                 |

### Seed permission penting

```txt
orders.read
orders.accept
orders.prepare
orders.ready
orders.complete
orders.cancel
payments.read
payments.manual_review
qr.manage
products.manage
settings.payment.manage
```

---

## 32. `role_permissions`

| Field           | Type          | Notes |
| --------------- | ------------- | ----- |
| `id`            | `uuid`        | PK    |
| `role_id`       | `uuid`        | FK    |
| `permission_id` | `uuid`        | FK    |
| `created_at`    | `timestamptz` |       |

### Constraint

```txt
unique(role_id, permission_id)
```

---

## 33. `admin_user_roles`

| Field           | Type          | Notes |
| --------------- | ------------- | ----- |
| `id`            | `uuid`        | PK    |
| `admin_user_id` | `uuid`        | FK    |
| `role_id`       | `uuid`        | FK    |
| `created_at`    | `timestamptz` |       |

---

## 34. `admin_outlet_scopes`

Outlet mana yang boleh diakses staff.

| Field                 | Type          | Notes |
| --------------------- | ------------- | ----- |
| `id`                  | `uuid`        | PK    |
| `admin_user_id`       | `uuid`        | FK    |
| `outlet_id`           | `uuid`        | FK    |
| `can_view`            | `boolean`     |       |
| `can_manage_orders`   | `boolean`     |       |
| `can_manage_products` | `boolean`     |       |
| `created_at`          | `timestamptz` |       |

### Constraint

```txt
unique(admin_user_id, outlet_id)
```

---

# I. Audit & Security

## 35. `audit_logs`

Wajib untuk order/payment/settings.

| Field          | Type             | Notes                                                  |
| -------------- | ---------------- | ------------------------------------------------------ |
| `id`           | `uuid`           | PK                                                     |
| `workspace_id` | `uuid`           | FK                                                     |
| `actor_type`   | `text`           | `admin_user`, `system`, `payment_provider`, `customer` |
| `actor_id`     | `uuid nullable`  |                                                        |
| `action`       | `text`           | `order.accepted`, `payment.paid`                       |
| `entity_type`  | `text`           | `order`, `payment`, `qr_code`, `settings`              |
| `entity_id`    | `uuid nullable`  |                                                        |
| `before_json`  | `jsonb nullable` |                                                        |
| `after_json`   | `jsonb nullable` |                                                        |
| `reason`       | `text nullable`  | Wajib untuk cancel                                     |
| `ip_address`   | `inet nullable`  |                                                        |
| `user_agent`   | `text nullable`  |                                                        |
| `created_at`   | `timestamptz`    |                                                        |

---

## 36. `security_events`

Optional untuk alpha, tapi bagus untuk QR/payment protection.

| Field           | Type             | Notes                                                     |
| --------------- | ---------------- | --------------------------------------------------------- |
| `id`            | `uuid`           | PK                                                        |
| `workspace_id`  | `uuid nullable`  |                                                           |
| `event_type`    | `text`           | `qr_invalid`, `rate_limited`, `payment_signature_invalid` |
| `severity`      | `text`           | `low`, `medium`, `high`, `critical`                       |
| `ip_address`    | `inet nullable`  |                                                           |
| `user_agent`    | `text nullable`  |                                                           |
| `metadata_json` | `jsonb nullable` |                                                           |
| `created_at`    | `timestamptz`    |                                                           |

---

# J. BayarGG Provider Seed

Karena provider aktif sekarang adalah **BayarGG**, seed awalnya begini:

## `payment_providers`

```json
{
  "code": "bayargg",
  "name": "BayarGG",
  "is_enabled": true,
  "supports_qris": true,
  "supports_va": true,
  "supports_ewallet": true,
  "supports_card": false
}
```

## `payment_provider_settings`

```json
{
  "provider": "bayargg",
  "mode": "sandbox",
  "is_active": true,
  "payment_expiry_minutes": 15,
  "secret_key_ref": "secret://selkop/bayargg/sandbox/secret_key",
  "webhook_secret_ref": "secret://selkop/bayargg/sandbox/webhook_secret",
  "config_json": {
    "environment": "sandbox",
    "enabled_methods": ["qris", "ewallet", "virtual_account"]
  }
}
```

---

# K. Final Table Count

Untuk Phase 3.2 ini, table yang kita desain:

```txt
36 tables
```

Tapi untuk alpha, yang benar-benar wajib aktif dulu sekitar:

```txt
workspaces
brands
outlets
qr_locations
qr_codes
qr_sessions
storefronts
storefront_outlets
product_categories
products
modifier_groups
modifier_options
product_modifier_groups
product_availability
checkout_sessions
checkout_items
idempotency_keys
orders
order_items
order_item_modifiers
order_status_history
payment_providers
payment_provider_settings
payments
payment_status_history
payment_webhook_events
admin_users
roles
permissions
role_permissions
admin_user_roles
admin_outlet_scopes
audit_logs
```

Yang bisa optional:

```txt
workspace_settings
storefront_settings
security_events
```

---

# L. Keputusan Desain yang Sudah Dikunci

| Area             | Decision                              |
| ---------------- | ------------------------------------- |
| Payment provider | Configurable dari Settings            |
| Active provider  | BayarGG                               |
| Payment schema   | Provider-agnostic                     |
| QR outlet        | Locked by QR code/session             |
| Cart             | Local frontend + backend validation   |
| Checkout         | Backend snapshot + idempotency        |
| Order status     | 3 layer: payment, fulfillment, public |
| Admin action     | Permission + allowed actions          |
| Delete order     | Tidak ada, pakai cancel               |
| Audit log        | Wajib                                 |
| Secrets          | Tidak disimpan mentah di DB           |

---