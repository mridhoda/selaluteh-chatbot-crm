# 🖥️ Panduan: Perbedaan Windows 11 vs Linux untuk Development

Dokumen ini menjelaskan perbedaan konfigurasi dan cara menjalankan project
**SelaluTeh Chatbot CRM** di **Windows 11** vs **Linux**.

---

## 📋 Ringkasan Perbedaan Utama

| Aspek | Linux | Windows 11 |
|---|---|---|
| **npm run dev (server)** | `NODE_OPTIONS="..." nodemon` | `nodemon --dns-result-order=ipv4first` |
| **Cloudflare Tunnel** | Named Tunnel via token (Zero Trust) | Local config tunnel (`config.yaml`) |
| **Tunnel protocol default** | QUIC (stabil) | QUIC sering gagal → pakai local config |
| **Tunnel domain** | `incretlabs.my.id` | `foodiserver.my.id` (akun berbeda) |
| **Vite allowedHosts** | Tidak perlu (localhost cukup) | Wajib tambahkan domain tunnel |
| **Loopback `127.0.0.1`** | Selalu bisa diakses cloudflared | Bind ke `0.0.0.0` untuk keandalan |

---

## 🐧 Cara Menjalankan di Linux

### 1. Jalankan Dev Server
```bash
npm run dev
```
Script otomatis menggunakan `NODE_OPTIONS="--dns-result-order=ipv4first"` yang valid di Linux.

### 2. Jalankan Cloudflare Tunnel (Named Tunnel via Token)
```bash
# Token dari Cloudflare Zero Trust Dashboard
cloudflared tunnel run --token <TOKEN_DARI_ZERO_TRUST>
```

Konfigurasi hostname diambil dari **Cloudflare Zero Trust Dashboard**:
- `crm-dev.incretlabs.my.id` → `http://127.0.0.1:5000`
- `app-dev.incretlabs.my.id` → `http://127.0.0.1:5173`

Tidak perlu file `config.yaml` lokal — konfigurasi dibaca dari server Cloudflare.

---

## 🪟 Cara Menjalankan di Windows 11

### 1. Jalankan Dev Server
```powershell
npm run dev
```

> ⚠️ **PENTING**: Script `dev` di `server/package.json` sudah diubah agar kompatibel
> dengan Windows. Jangan kembalikan ke format Linux.
>
> Format Windows yang benar:
> ```json
> "dev": "nodemon --dns-result-order=ipv4first src/index.js"
> ```

### 2. Jalankan Cloudflare Tunnel (Local Config Tunnel)
```powershell
cloudflared tunnel run eskalabot-crm
```

Tunnel ini menggunakan file config lokal di:
```
C:\Users\User\.cloudflared\config.yaml
```

**Kenapa pakai local config tunnel di Windows?**

Di Windows, Named Tunnel via token sering mengalami masalah:
- Protocol QUIC (UDP) sering diblokir oleh firewall/ISP
  → error `failed to run the datagram handler`
- Menambahkan `--protocol http2` membantu koneksi tunnel,
  tapi routing ke server lokal tetap tidak berfungsi di beberapa kondisi Windows
- Solusi terbaik: gunakan **local config tunnel** dari akun Cloudflare yang sama
  dengan domain yang digunakan

---

## 🔧 Konfigurasi Tunnel Windows (`config.yaml`)

File: `C:\Users\User\.cloudflared\config.yaml`

```yaml
tunnel: e1f84077-6474-4662-ac4c-e0e71b53a6e3
credentials-file: C:\Users\User\.cloudflared\e1f84077-6474-4662-ac4c-e0e71b53a6e3.json

ingress:
  # SelaluTeh CRM Dev — backend API (port 5000)
  - hostname: crm-dev.foodiserver.my.id
    service: http://127.0.0.1:5000

  # SelaluTeh CRM Dev — frontend Vite (port 5173)
  - hostname: app-dev.foodiserver.my.id
    service: http://127.0.0.1:5173
    originRequest:
      noTLSVerify: true

  # (hostname lain untuk project CCTV tetap ada di bawah)

  - service: http_status:404
```

> ⚠️ **Kenapa domain berbeda?**
> Tunnel `e1f84077` berada di akun Cloudflare yang mengelola `foodiserver.my.id`.
> Domain `incretlabs.my.id` berada di akun Cloudflare yang BERBEDA.
> Cloudflare Tunnel tidak bisa digunakan lintas akun via CNAME.
> Oleh karena itu di Windows menggunakan domain `foodiserver.my.id`.

---

## 🌐 Perbedaan URL Akses

| Platform | Frontend URL | Backend API URL |
|---|---|---|
| **Linux** | `https://app-dev.incretlabs.my.id` | `https://crm-dev.incretlabs.my.id` |
| **Windows 11** | `https://app-dev.foodiserver.my.id` | `https://crm-dev.foodiserver.my.id` |

---

## ⚙️ File Konfigurasi yang Perlu Disesuaikan Per Platform

### 1. `server/package.json` — script `dev`

**Linux** (format asli):
```json
"dev": "NODE_OPTIONS=\"--dns-result-order=ipv4first\" nodemon src/index.js"
```

**Windows** (format yang sudah diubah):
```json
"dev": "nodemon --dns-result-order=ipv4first src/index.js"
```

---

### 2. `web/vite.config.js` — `server.allowedHosts`

Di Windows, Vite wajib di-whitelist domain tunnel karena ada security check Host header:

```js
server: {
  host: true,
  cors: true,
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    '.incretlabs.my.id',
    '.foodiserver.my.id',
    '.trycloudflare.com',  // untuk quick tunnel testing
  ],
}
```

Di Linux dengan Named Tunnel, cukup:
```js
allowedHosts: ['app-dev.incretlabs.my.id'],
```

---

### 3. `server/.env` — `CORS_ORIGIN`

Tambahkan semua domain yang mungkin mengakses backend:

```env
CORS_ORIGIN=https://app-dev.incretlabs.my.id,https://crm-dev.incretlabs.my.id,https://app-dev.foodiserver.my.id,https://crm-dev.foodiserver.my.id,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://192.168.10.36:5173,http://192.168.10.36:5174
```

---

## 🚨 Troubleshooting Windows

### ❌ `NODE_OPTIONS is not recognized`
Script `dev` di `server/package.json` masih dalam format Linux.
**Solusi**: Ubah ke format Windows:
```json
"dev": "nodemon --dns-result-order=ipv4first src/index.js"
```

---

### ❌ `failed to run the datagram handler`
Cloudflare tunnel menggunakan QUIC (UDP) yang diblokir Windows/ISP.
**Solusi**: Gunakan local config tunnel:
```powershell
cloudflared tunnel run eskalabot-crm
```
Atau jika tetap pakai named tunnel, tambahkan `--protocol http2`.

---

### ❌ Vite `403 Forbidden` melalui tunnel
Vite menolak request karena domain tunnel tidak ada di `allowedHosts`.
**Solusi**: Tambahkan domain ke `web/vite.config.js`:
```js
allowedHosts: ['.foodiserver.my.id', '.incretlabs.my.id', ...]
```

---

### ❌ Error `1033` — Cloudflare Tunnel Error
Cloudflare tidak bisa menemukan tunnel aktif untuk hostname tersebut.
Penyebab umum:
1. `cloudflared tunnel run eskalabot-crm` belum dijalankan
2. CNAME domain mengarah ke tunnel dari akun Cloudflare yang berbeda
3. Tunnel ID di `config.yaml` tidak sesuai dengan credential file

**Solusi**: Pastikan tunnel berjalan dan CNAME domain mengarah ke tunnel ID
yang berada di akun Cloudflare yang sama dengan domain tersebut.

---

### ❌ Error `502 Bad Gateway`
Server lokal tidak merespons.
**Solusi**: Pastikan `npm run dev` sudah berjalan:
```powershell
netstat -ano | findstr ":5000 :5173"
# Harus muncul dua baris LISTENING
```

---

## 📝 Checklist Sebelum Mulai Development

### Linux
- [ ] `npm run dev` berjalan (muncul `API listening on http://localhost:5000` dan `VITE ready`)
- [ ] `cloudflared tunnel run --token <TOKEN>` berjalan (4 connections registered)
- [ ] Akses `https://app-dev.incretlabs.my.id` di browser

### Windows 11
- [ ] `npm run dev` berjalan tanpa error `NODE_OPTIONS`
- [ ] `cloudflared tunnel run eskalabot-crm` berjalan (4 connections registered)
- [ ] Akses `https://app-dev.foodiserver.my.id` di browser
