# Image Generation QA Checklist

## Status

Dokumen ini **reserved/optional**. Backend SelaluTeh Chatbot CRM / Telegram Marketplace MVP saat ini tidak menjadikan image generation sebagai core scope.

Tetap disimpan karena ke depan app mungkin memakai AI-generated media untuk:

- Product promotional asset.
- AI-generated menu visual.
- Campaign content.
- Admin preview image.

Jika fitur image generation tidak dipakai, checklist ini boleh diabaikan.

## QA Checklist for Future AI Image Asset Generation

### Brand Safety

- [ ] Tidak menggunakan logo yang salah.
- [ ] Tidak menghasilkan elemen brand kompetitor.
- [ ] Warna dan style sesuai brand guide.
- [ ] Tidak menciptakan klaim produk palsu.

### Product Accuracy

- [ ] Cup/product shape sesuai referensi.
- [ ] Label dan varian tidak tertukar.
- [ ] Tidak menampilkan harga/promo yang tidak ada di database.
- [ ] Tidak menampilkan ingredient yang tidak benar.

### Technical Quality

- [ ] Resolution sesuai kebutuhan.
- [ ] Background sesuai permintaan.
- [ ] Tidak ada artefak visual besar.
- [ ] File tersimpan ke local storage sesuai folder.
- [ ] Metadata file masuk `files` table jika dipakai di app.

### Safety

- [ ] Tidak menampilkan orang nyata tanpa izin.
- [ ] Tidak menampilkan konten berbahaya.
- [ ] Tidak memakai asset copyrighted tanpa izin.

## Recommendation

Jangan campurkan image generation QA dengan marketplace/payment release gate kecuali fitur tersebut aktif di MVP.
