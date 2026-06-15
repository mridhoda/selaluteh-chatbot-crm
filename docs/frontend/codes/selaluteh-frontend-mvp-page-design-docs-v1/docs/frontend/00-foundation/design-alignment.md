# Design Alignment

## 1. Visual direction

Semua halaman harus terasa sebagai bagian dari dashboard yang sama dengan Orders page dan sidebar Selalu Teh saat ini.

Gunakan:

- background aplikasi sangat terang / soft neutral;
- surface putih untuk card, table, drawer, dan modal;
- text utama navy gelap;
- accent utama mengikuti token brand pink yang sudah ada;
- section label/sidebar menggunakan token purple yang sudah ada;
- success menggunakan semantic green;
- warning menggunakan amber;
- danger menggunakan red;
- info atau ready state dapat menggunakan blue;
- border tipis, shadow lembut, radius konsisten;
- ikon outline sederhana dan konsisten.

**Jangan menambahkan color system baru.** Gunakan CSS variables atau token yang sudah ada pada project/docs. Jika token belum tersedia, buat semantic tokens, bukan hard-coded warna di setiap component.

Contoh semantic token:

```css
--color-brand-primary
--color-brand-primary-soft
--color-text-primary
--color-text-secondary
--color-border-default
--color-surface-page
--color-surface-card
--color-success
--color-warning
--color-danger
--color-info
```

## 2. Page shell

Semua halaman utama memakai shell berikut:

```txt
Page header
├── title
├── concise description
├── primary/secondary actions
└── optional last-updated state

Filter/search toolbar
Optional active-filter chips (only when non-default filters exist)
Optional summary cards
Main content table/list/canvas
Pagination or infinite-load control
Right detail drawer or modal
```

### Header rule

- Title jelas dan pendek.
- Subtitle menjelaskan scope workspace/outlet.
- Primary action diletakkan kanan.
- Jangan menggunakan lebih dari satu filled primary action pada satu header.

### Active filter rule

Jangan tampilkan banner seperti `Showing: All Outlets · Today` ketika filter masih default.

Tampilkan active-filter strip hanya ketika ada filter non-default:

```txt
Active filters: Selkop Samarinda ×  Pending Payment ×  Today ×  Clear all
```

## 3. Layout density

Desktop dashboard harus cukup padat untuk operasional, namun tidak cramped.

- page content horizontal padding: mengikuti Orders page;
- card gap konsisten;
- table row cukup tinggi untuk dua baris metadata;
- drawer width cukup untuk detail tanpa menutupi seluruh table;
- gunakan whitespace untuk grouping, bukan banyak divider berat.

## 4. Reusable interaction patterns

Gunakan pola yang sama di kelima halaman:

- filter dropdown;
- search input;
- status badge;
- active-filter chips;
- data table;
- detail drawer;
- confirmation dialog;
- toast feedback;
- skeleton loading;
- empty state;
- inline error with retry;
- permissions-based disabled/hidden action.

## 5. Accessibility

- Semua field memiliki visible label atau `aria-label` yang jelas.
- Jangan mengandalkan warna saja untuk status.
- Semua status badge punya text.
- Focus ring harus terlihat.
- Modal/drawer menangkap focus dan mengembalikannya saat ditutup.
- Icon-only button memiliki tooltip dan accessible label.
- Target klik minimum 40px untuk action penting.
- Table harus tetap dapat dipahami pada zoom 200%.

## 6. Responsive behavior

### Desktop >= 1280px

- full sidebar;
- filters satu baris bila muat;
- table penuh;
- right detail drawer.

### Tablet 768–1279px

- sidebar collapsible;
- filters wrap menjadi 2 baris;
- summary cards horizontal scroll atau 2–3 kolom;
- table horizontal scroll;
- drawer lebih lebar secara proporsional.

### Mobile < 768px

- gunakan stacked cards/list untuk table-heavy pages;
- filters masuk filter sheet;
- detail drawer menjadi full-screen sheet;
- chat menjadi single-pane navigation: list → conversation → context;
- jangan mencoba memampatkan desktop table ke layar kecil.
