# Panduan Menggunakan Cloudflare Tunnel di Proyek Ini

Cloudflare Tunnel (via CLI `cloudflared`) digunakan untuk membuat kanal aman dari internet publik ke backend lokal Anda (`http://localhost:5000`). Gunakan URL publik yang dihasilkan untuk mendaftarkan webhook platform eksternal (Telegram, WhatsApp, dsb.).

## 1. Instalasi Cloudflared CLI

- Unduh dari https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
- Ikuti petunjuk instalasi sesuai OS Anda hingga perintah `cloudflared` tersedia di terminal.

## 2. Jalankan Tunnel Cepat (Quick Tunnel)

Quick Tunnel cocok untuk pengujian cepat tanpa autentikasi:

```bash
# Terminal 1: jalankan backend
cd server
npm run dev

# Terminal 2: buka tunnel ke backend
cloudflared tunnel --url http://localhost:5000
```

`cloudflared` akan menampilkan URL acak seperti `https://example.trycloudflare.com`. Simpan URL tersebut di `.env` backend:

```env
PUBLIC_BASE_URL=https://example.trycloudflare.com
```

Gunakan URL yang sama untuk pendaftaran webhook: `https://example.trycloudflare.com/webhook/<platform>`.

## 3. Jalankan Tunnel Terkelola (Named Tunnel) — Opsional

Jika ingin URL yang stabil dan kontrol penuh:

1. Login ke Cloudflare Zero Trust di https://one.dash.cloudflare.com/
2. Buat **Tunnel** baru dan salin **Tunnel Token** yang disediakan Cloudflare.
3. Jalankan:
   ```bash
   cloudflared tunnel run --token <TUNNEL_TOKEN_DARI_CLOUDFLARE>
   ```
4. Di dashboard Cloudflare, konfigurasi routing (mis. `https://bot.example.com`  `http://localhost:5000`).

## 4. Tips & Keamanan

- Simpan token Cloudflare di variabel lingkungan atau secret manager, jangan commit ke repo.
- Set `PUBLIC_BASE_URL` setiap kali URL Quick Tunnel berubah.
- Untuk produksi, gunakan Named Tunnel agar URL konsisten dan bisa dikunci dengan Access Policies.
