# KALIS.AI — Outlets Page

Implementasi React + Tailwind CSS untuk layout Outlets tanpa navbar/sidebar.

## Instalasi

```bash
npm install lucide-react
```

Pastikan Tailwind CSS sudah aktif di project Vite Anda.

## File

- `src/pages/OutletsPage.jsx`
- `src/App.jsx`

## Asset outlet

Komponen memakai path lokal seperti:

```txt
/public/images/outlets/samarinda-central.jpg
/public/images/outlets/tenggarong-riverside.jpg
```

Apabila gambar belum tersedia, komponen otomatis menampilkan gradient placeholder KALIS.AI.

## Warna

Palette utama sudah ditanam langsung melalui arbitrary Tailwind values:

- Brand Coral: `#F43F70`
- Navy Deep: `#11182E`
- AI Violet: `#6956E8`
- Success Green: `#16A34A`
- Preparing Orange: `#EA7200`
- Danger Red: `#DC3545`

Tidak memerlukan perubahan pada `tailwind.config.js`.
