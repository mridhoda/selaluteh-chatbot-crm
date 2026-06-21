import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WS = '60f7c52e-b086-4144-994b-a1260ee00ec9';

const knowledgeData = [
  {
    title: 'FAQ Produk SelaluTeh',
    source_type: 'faq',
    scope: 'workspace',
    content: `# FAQ Produk SelaluTeh

## Teh Manis
Teh manis adalah minuman teh yang diberi gula. Tersedia dalam varian:
- Teh Manis Reguler (Rp 3.000)
- Teh Manis Large (Rp 5.000)
- Teh Manis Extra Manis (Rp 3.500)

## Teh Tawar
Teh tawar tanpa gula. Tersedia dalam varian:
- Teh Tawar Reguler (Rp 2.000)
- Teh Tawar Large (Rp 4.000)

## Es Teh
Semua varian teh tersedia dalam versi es (dingin) dengan tambahan Rp 1.000.

## Promosi
- Pembelian 3 Teh Manis Large gratis 1 Teh Tawar Reguler
- Setiap pembelian di atas Rp 20.000 mendapat 1 poin loyalty
- Promo berlaku setiap hari Senin-Jumat, jam 10.00-16.00`,
    status: 'draft',
  },
  {
    title: 'SOP Pemesanan',
    source_type: 'sop',
    scope: 'workspace',
    content: `# SOP Pemesanan SelaluTeh

## Cara Pemesanan
1. Customer memilih outlet terdekat
2. Customer memilih produk dari menu
3. Customer konfirmasi pesanan
4. Sistem membuat order
5. Customer melakukan pembayaran via link pembayaran
6. Pesanan diproses setelah pembayaran dikonfirmasi

## Outlet
Pemesanan hanya untuk pickup - tidak ada delivery.
Customer harus memilih outlet terlebih dahulu sebelum memesan.

## Pembayaran
Pembayaran dilakukan via link pembayaran yang dikirim setelah order dikonfirmasi.
Status pembayaran: pending / paid / expired / failed.
Hanya sistem backend yang bisa menandai pembayaran sebagai paid.`,
    status: 'draft',
  },
  {
    title: 'Kebijakan Keluhan dan Pengembalian',
    source_type: 'refund_policy',
    scope: 'workspace',
    content: `# Kebijakan Keluhan dan Pengembalian

## Jenis Keluhan yang Diterima
1. Pesanan salah
2. Produk tidak sesuai
3. Rasa tidak enak
4. Pesanan kurang
5. Staff tidak ramah

## Prosedur
1. Customer menyampaikan keluhan ke AI
2. AI mencatat detail keluhan
3. Jika keluhan sederhana, AI bisa langsung membantu
4. Jika keluhan kompleks, akan dialihkan ke admin
5. Admin akan follow-up maksimal 1x24 jam

## Pengembian dana
Kebijakan refund diputuskan oleh admin setelah review.
AI tidak bisa memproses refund secara mandiri.`,
    status: 'draft',
  },
  {
    title: 'Jam Operasional',
    source_type: 'opening_hours',
    scope: 'workspace',
    content: `# Jam Operasional SelaluTeh

## Jam Buka
- Senin - Jumat: 08.00 - 21.00
- Sabtu: 09.00 - 22.00
- Minggu: 10.00 - 20.00
- Hari Libur Nasional: 10.00 - 18.00

## Jam Sibuk
- Senin - Jumat: 11.00 - 13.00 dan 16.00 - 18.00
- Sabtu - Minggu: 18.00 - 20.00

## Catatan
Outlet bisa tutup lebih awal jika stok habis.
Informasi outlet spesifik bisa dicek via tool get_outlets.`,
    status: 'draft',
  },
  {
    title: 'Brand Tone SelaluTeh',
    source_type: 'brand_tone',
    scope: 'workspace',
    content: `# Brand Tone SelaluTeh

## Karakter
- Ramah dan hangat seperti secangkir teh
- Menggunakan Bahasa Indonesia sehari-hari
- Gaya bicara santai dan gaul (Gen Z)
- Tidak terlalu formal tapi tetap sopan

## Contoh
✅ "Hai! Mau pesan teh apa hari ini?"
✅ "Siap, teh manisnya udah di keranjang!"
✅ "Wah, maaf ya kalo ada yang kurang. Saya bantu cek."
❌ "Berdasarkan analisis sistem, pesanan Anda telah tercatat."
❌ "Mohon maaf atas ketidaknyamanan yang terjadi."
❌ Menggunakan bahasa Inggris kalau tidak perlu

## Larangan
- Jangan panggil customer "anda" terus-terusan
- Jangan terlalu kaku
- Jangan gunakan jargon teknis
- Jangan bohong atau janji yang tidak bisa dipenuhi`,
    status: 'draft',
  },
];

async function seed() {
  console.log('Seeding knowledge sources...\n');

  for (const k of knowledgeData) {
    const { data, error } = await supabase
      .from('knowledge_sources')
      .insert({
        workspace_id: WS,
        title: k.title,
        source_type: k.source_type,
        scope: k.scope || 'workspace',
        content: k.content,
        status: 'draft',
        version: 1,
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ ${k.title}: ${error.message}`);
    } else {
      console.log(`  ✅ ${k.title} (id: ${data.id.slice(0, 8)}...)`);
    }
  }

  console.log('\nDone! Seed ' + knowledgeData.length + ' knowledge sources.');
}

seed();
