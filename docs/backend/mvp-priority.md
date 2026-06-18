Untuk MVP sekarang, **jangan langsung menyiapkan Telegram dan WhatsApp checkout sekaligus**. Itu berisiko membuat scope melebar. Arah paling aman untuk Selalu Teh adalah:

```txt
MVP 1: Telegram-first marketplace
MVP 1.1: WhatsApp sebagai channel tambahan
Future: web storefront/customer marketplace
```

## Halaman yang perlu disiapkan terlebih dahulu

### **P0 — wajib agar transaksi benar-benar berjalan**

Urutan implementasinya:

1. **Connected Platforms**
    
    - Hubungkan bot Telegram.
        
    - Lihat status koneksi dan webhook.
        
    - Tes pesan masuk/keluar.
        
    - WhatsApp boleh tetap tampil sebagai “Coming soon” atau belum diaktifkan.
        
2. **Outlets**
    
    - Daftar outlet.
        
    - Status aktif/nonaktif.
        
    - Jam operasional.
        
    - Informasi kontak dan alamat.
        
    - Tentukan produk yang tersedia per outlet.
        
3. **Products**
    
    - Nama, foto, harga, kategori, status.
        
    - Variasi/modifier sederhana.
        
    - Ketersediaan per outlet.
        
    - Jangan membuat inventory rumit dulu kecuali benar-benar dibutuhkan.
        
4. **Orders**
    
    - Filter berdasarkan outlet, channel, status pembayaran, dan status order.
        
    - Detail order.
        
    - Update status.
        
    - Buka chat pelanggan.
        
    - Kirim ulang payment link.
        
    - Timeline transaksi.
        
5. **Payments**
    
    - Ini belum ada di sidebar kamu dan **sebaiknya ditambahkan**.
        
    - Daftar pembayaran.
        
    - Status `pending`, `paid`, `expired`, `failed`, `cancelled`.
        
    - Payment-link details.
        
    - Webhook event atau payment timeline.
        
    - Tidak boleh ada tombol manual “Mark as Paid” untuk pembayaran gateway.
        
6. **Chat**
    
    - Percakapan pelanggan.
        
    - Human takeover.
        
    - Konteks outlet dan order aktif.
        
    - Tombol buka detail order dari chat.
        
7. **Settings**
    
    - Pengaturan workspace.
        
    - Payment gateway.
        
    - Default outlet behavior.
        
    - Telegram bot configuration.
        
    - Notification settings.
        

---

# Checkout perlu halaman sendiri?

Menurutku **tidak perlu ada menu atau halaman “Checkout” di admin dashboard**.

Checkout pelanggan terjadi di Telegram:

```txt
Pilih outlet
→ lihat produk
→ tambah ke cart
→ lihat ringkasan
→ konfirmasi checkout
→ order dibuat
→ payment link dikirim
→ pembayaran diverifikasi webhook
```

Di dashboard, hasil checkout dikelola melalui:

```txt
Orders
+
Payments
+
Chat
```

Jadi jangan menambahkan menu `Checkout` hanya karena ada flow checkout. Itu backend flow, bukan admin resource utama.

---

# Susunan sidebar MVP yang lebih tepat

Dari sidebar kamu sekarang, aku sarankan untuk tahap commerce MVP menjadi:

```txt
COMMERCE
Dashboard
Orders
Products
Outlets
Payments

CRM
Chat
Contacts
Connected Platforms
AI Agents
Human Agents
Complaints

INSIGHTS
Analytics
Reports

SYSTEM
Settings
Billing
Profile
```

Namun yang perlu benar-benar selesai lebih dahulu hanya:

```txt
Connected Platforms
Outlets
Products
Orders
Payments
Chat
Settings
```

## Dashboard jangan dikerjakan terlalu awal

Dashboard tetap boleh ada, tapi sementara cukup sederhana:

- order hari ini
    
- pending payment
    
- order perlu perhatian
    
- performa per outlet
    
- platform status
    

Jangan menghabiskan waktu membuat banyak chart sebelum alur berikut benar-benar berhasil:

```txt
Telegram
→ Product
→ Cart
→ Checkout
→ Order
→ Payment
→ Fulfillment
```

---

# Halaman yang bisa ditunda

### **P1 — sesudah transaksi inti stabil**

```txt
Dashboard lengkap
Contacts
AI Agents enhancement
Human Agents management
Analytics
Reports
```

### **P2 — bukan kebutuhan transaksi MVP**

```txt
Complaints
Billing
Profile enhancement
Marketing
Campaigns
Advanced inventory
Voucher
Refund management
```

Complaints boleh tetap ada karena berasal dari CRM lama, tetapi tidak perlu menjadi bagian inti pengerjaan marketplace pertama.

---

# Telegram atau WhatsApp dahulu?

## Pilih **Telegram dahulu** ✅

Alasannya berdasarkan arah project kamu:

- Telegram flow sudah menjadi target MVP.
    
- Bot interaction lebih mudah kamu kendalikan.
    
- Produk, outlet, cart, checkout, dan payment link bisa diuji tanpa harus membangun customer website.
    
- Lebih cepat membuktikan apakah alur commerce kamu benar.
    
- Backend yang sama nanti bisa dipakai ulang oleh WhatsApp.
    

Arsitekturnya:

```txt
Commerce Backend
├── Products
├── Outlets
├── Carts
├── Checkout
├── Orders
└── Payments

Channels
├── Telegram — MVP
├── WhatsApp — next
└── Web storefront — future
```

Jangan membuat logic order khusus Telegram. Telegram hanya adapter/channel. Core cart, checkout, order, dan payment tetap berada di backend supaya WhatsApp nanti bisa memakai service yang sama.

---

# Tahapan pengerjaan yang aku rekomendasikan

## Sprint A — Catalog foundation

```txt
Outlets
Products
Product availability per outlet
```

## Sprint B — Telegram commerce

```txt
Connected Platforms
Outlet selection
Product browsing
Cart
Checkout confirmation
```

## Sprint C — Transaction operations

```txt
Orders
Order detail
Order status
Chat-to-order linking
```

## Sprint D — Payment

```txt
Payments page
Payment link
Payment webhook
Paid notification
Idempotency
```

## Sprint E — MVP hardening

```txt
Error states
Expired payment
Unavailable product
Closed outlet
Duplicate webhook
Access control per outlet
Basic dashboard
```

## Sprint F — WhatsApp integration

```txt
WhatsApp channel adapter
Product/catalog presentation
Incoming order mapping
Payment-link delivery
Order notifications
```

---

# Kesimpulan

Fokus MVP kamu sebaiknya:

```txt
Telegram-first marketplace
```

Halaman prioritasnya:

```txt
1. Connected Platforms
2. Outlets
3. Products
4. Orders
5. Payments
6. Chat
7. Settings
```

Dan perubahan paling penting pada navbar kamu sekarang adalah **tambahkan halaman `Payments` setelah `Orders`**, karena order dan pembayaran harus tetap menjadi dua resource yang berbeda. Setelah Telegram berhasil dari awal sampai pembayaran, barulah sambungkan WhatsApp ke backend commerce yang sama. 🚀

products, payments, chat, dan settings, connected platforms