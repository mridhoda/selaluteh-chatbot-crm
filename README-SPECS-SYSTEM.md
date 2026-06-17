# SelaluTeh Specs Lifecycle System

Sistem ini mengelola requirements-first specs dengan tiga bucket fisik:

```text
specs/
├── backlog/
├── active/
└── completed/
```

Setiap spec tetap memiliki empat file utama:

```text
<spec-id>/
├── spec.yaml
├── requirements.md
├── design.md
└── tasks.md
```

`status` pada `spec.yaml` menentukan lokasi folder. `workflow_state`
menjelaskan kondisi internal spec.

---

## 1. Struktur Repository

```text
docs/
└── backend/
    ├── READING-ORDER.md
    └── 09-ai-context/
        └── current-task.md

specs/
├── specs.config.yaml
├── SPECS-INDEX.md
│
├── _templates/
│   └── feature/
│       ├── spec.yaml
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
│
├── backlog/
├── active/
│   └── selaluteh-backend-marketplace/
│       ├── spec.yaml
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
│
└── completed/

scripts/
└── specs/
    └── sync-spec-folders.mjs

.github/
└── workflows/
    └── specs-check.yml
```

---

## 2. Pembagian Tanggung Jawab

| File | Tanggung jawab |
|---|---|
| `specs.config.yaml` | Aturan global seluruh spec |
| `spec.yaml` | Identitas, scope, status, lifecycle, references |
| `requirements.md` | Apa yang wajib dilakukan sistem |
| `design.md` | Bagaimana requirement dipenuhi |
| `tasks.md` | Urutan implementasi dan verifikasi |
| `READING-ORDER.md` | Entry point developer dan coding agent |
| `current-task.md` | Pointer eksplisit ke spec dan task aktif |
| `SPECS-INDEX.md` | Index otomatis seluruh spec |
| `sync-spec-folders.mjs` | Validator dan folder synchronizer |

---

## 3. Status dan Workflow State

### Backlog

```yaml
status: backlog
workflow_state: draft
```

Workflow state yang valid:

```text
draft
review
approved
```

Folder:

```text
specs/backlog/<spec-id>/
```

### Active

```yaml
status: active
workflow_state: in_progress
```

Workflow state yang valid:

```text
in_progress
blocked
verifying
```

Folder:

```text
specs/active/<spec-id>/
```

### Completed

```yaml
status: completed
workflow_state: done
```

Workflow state yang valid:

```text
done
archived
```

Folder:

```text
specs/completed/<spec-id>/
```

`blocked` tetap berada di bucket `active`, karena spec tersebut masih menjadi
pekerjaan aktif tetapi sedang terhambat.

---

## 4. Instalasi

Letakkan file-file sistem pada root repository, lalu jalankan:

```bash
chmod +x install-specs-system.sh
./install-specs-system.sh
```

Installer akan:

1. memeriksa Node.js, npm, dan `package.json`;
2. membuat folder bucket yang diperlukan;
3. menambahkan npm scripts secara idempotent;
4. memasang package `yaml`;
5. memeriksa syntax script;
6. menjalankan dry run;
7. menjalankan `specs:check`.

Untuk langsung menerapkan perpindahan folder:

```bash
./install-specs-system.sh --sync
```

Pilihan lain:

```bash
./install-specs-system.sh --help
./install-specs-system.sh --skip-install
./install-specs-system.sh --skip-check
./install-specs-system.sh --repo-root /path/to/repository
```

---

## 5. NPM Scripts

Tambahkan isi `package-json-snippet.json` ke root `package.json`, atau biarkan
installer menambahkannya otomatis.

### Validasi tanpa perubahan

```bash
npm run specs:check
```

Perintah ini:

- tidak memindahkan folder;
- tidak memperbarui file;
- gagal jika status dan folder tidak cocok;
- gagal jika index stale;
- cocok untuk CI.

### Validasi verbose

```bash
npm run specs:check:verbose
```

### Preview sinkronisasi

```bash
npm run specs:sync:dry
```

Perintah ini menampilkan:

- folder yang akan dipindahkan;
- index yang akan diperbarui;

tanpa mengubah repository.

### Terapkan sinkronisasi

```bash
npm run specs:sync
```

Perintah ini:

- memindahkan seluruh folder spec berdasarkan `status`;
- memperbarui `updated_at`;
- memperbarui `lifecycle.current_bucket`;
- memperbarui `lifecycle.current_path`;
- membuat ulang `SPECS-INDEX.md`.

### Bantuan CLI

```bash
npm run specs:help
```

---

## 6. Apakah Script Berjalan Otomatis?

Tidak ketika file disimpan.

```text
Edit spec.yaml
→ npm run specs:sync:dry
→ npm run specs:sync
→ npm run specs:check
```

GitHub Actions otomatis menjalankan:

```bash
npm run specs:check
```

pada pull request dan push yang menyentuh sistem spec.

CI sengaja tidak:

- memindahkan folder;
- mengedit file;
- membuat commit otomatis.

Perpindahan folder harus dilakukan secara sadar oleh developer atau coding
agent melalui `npm run specs:sync`.

---

## 7. Mengaktifkan Spec

Misalnya spec berada di backlog:

```text
specs/backlog/payment-reconciliation/
```

Ubah `spec.yaml`:

```yaml
status: active
workflow_state: in_progress
```

Perbarui:

```text
docs/backend/09-ai-context/current-task.md
```

Pointer harus menggunakan target path:

```yaml
active_spec:
  id: payment-reconciliation
  path: specs/active/payment-reconciliation/spec.yaml

active_task:
  id: "1.1"
  title: Implement first task
  source: specs/active/payment-reconciliation/tasks.md
```

Kemudian jalankan:

```bash
npm run specs:sync:dry
npm run specs:sync
npm run specs:check
```

---

## 8. Menyelesaikan Spec

Sebelum menyelesaikan spec:

1. selesaikan seluruh required task;
2. jalankan test dan Definition of Done;
3. perbarui `implementation-status.md`;
4. perbarui `progress-log.md`;
5. pindahkan pointer `current-task.md` ke spec aktif berikutnya, atau ubah
   pointer menjadi `idle`;
6. ubah `spec.yaml`.

```yaml
status: completed
workflow_state: done
```

Kemudian:

```bash
npm run specs:sync:dry
npm run specs:sync
npm run specs:check
```

Script menolak status `completed` jika masih ada required checklist:

```markdown
- [ ] Required task
```

Optional task tidak menghalangi completion jika memiliki marker yang
didefinisikan dalam `specs.config.yaml`, misalnya:

```markdown
- [ ]* Optional task
```

atau mengandung:

```text
optional
post-mvp
```

Checklist di dalam fenced code block diabaikan.

---

## 9. Menandai Current Task Sebagai Idle

Ketika belum ada task aktif, gunakan front matter:

```yaml
---
schema_version: 1
status: idle
updated_at: 2026-06-17
---
```

Dalam mode `idle`, hilangkan `active_spec` dan `active_task`.

Script tidak memilih spec atau task berikutnya secara otomatis. Hal ini
mencegah coding agent mengerjakan backlog tanpa persetujuan.

---

## 10. Validasi yang Dilakukan

Script memeriksa:

- config YAML valid;
- status folders tersedia;
- spec ID memakai kebab-case;
- spec ID unik;
- folder name sama dengan spec ID;
- metadata wajib tersedia;
- status valid;
- priority valid;
- workflow state cocok dengan status;
- empat dokumen wajib tersedia;
- required task selesai sebelum completed;
- current-task menunjuk spec active;
- current-task ID dan path konsisten;
- active task source tersedia;
- active task ID ditemukan pada `tasks.md`;
- `SPECS-INDEX.md` terbaru;
- folder fisik cocok dengan status.

---

## 11. Current Task dan Reading Order

Coding agent selalu diarahkan ke:

```text
docs/backend/READING-ORDER.md
```

Kemudian agent membaca:

```text
docs/backend/09-ai-context/current-task.md
→ active_spec.path
→ spec.yaml
→ requirements.md
→ design.md
→ active task pada tasks.md
```

Agent tidak boleh:

- memilih sendiri salah satu folder di `active`;
- lanjut ke task berikutnya tanpa pointer;
- mengimplementasikan backlog;
- membuka kembali completed spec tanpa perubahan status eksplisit.

Prompt ringkas:

```text
Read docs/backend/READING-ORDER.md first.

Then read docs/backend/09-ai-context/current-task.md and follow the declared
active_spec and active_task. Implement only that task.

After implementation, update tasks.md, implementation-status.md,
progress-log.md, and current-task.md. Then run:

npm run specs:check
```

---

## 12. SPECS-INDEX.md

`SPECS-INDEX.md` dibuat ulang oleh:

```bash
npm run specs:sync
```

Kolomnya:

```text
Status
Workflow
Priority
ID
Spec
Path
```

Jangan edit file index secara manual.

---

## 13. GitHub Actions

Simpan workflow di:

```text
.github/workflows/specs-check.yml
```

Workflow berjalan pada:

- manual dispatch;
- pull request yang menyentuh file spec;
- push ke `main` atau `master` yang menyentuh file spec.

Workflow hanya menjalankan:

```bash
npm run specs:check
```

Gunakan `npm ci` ketika `package-lock.json` tersedia, dan fallback ke
`npm install --ignore-scripts` ketika lockfile belum tersedia.

---

## 14. Common Errors

### Folder dan status tidak cocok

```text
Folder/status mismatch:
payment-reconciliation:
specs/backlog/payment-reconciliation
→ specs/active/payment-reconciliation
```

Perbaikan:

```bash
npm run specs:sync
```

### Current task masih menunjuk spec completed

Perbarui atau kosongkan `current-task.md` sebelum sync.

### Required task masih terbuka

Centang required task yang benar-benar selesai. Jangan mengubahnya menjadi
optional hanya agar validasi lulus.

### Index stale

```bash
npm run specs:sync
```

### Active task ID tidak ditemukan

Pastikan `active_task.id` menggunakan ID yang benar-benar ada pada checklist
atau heading di `tasks.md`.

---

## 15. Safety Decisions

Sistem ini sengaja tidak:

- memindahkan folder saat save;
- mengubah current task otomatis;
- memilih spec aktif berikutnya;
- melakukan commit otomatis dari CI;
- mengubah requirement atau design;
- menandai task selesai otomatis.

Git umumnya mengenali filesystem rename sebagai perpindahan berdasarkan
kemiripan konten, tetapi script tidak menjanjikan atau memanipulasi Git
history secara khusus.

---

## 16. Recommended Workflow

```text
1. Edit metadata atau task
2. Update current-task.md
3. npm run specs:sync:dry
4. npm run specs:sync
5. npm run specs:check
6. Review git diff
7. Commit
8. CI runs specs:check
```

---

## 17. File Placement

```text
specs/specs.config.yaml
scripts/specs/sync-spec-folders.mjs
.github/workflows/specs-check.yml
install-specs-system.sh
package-json-snippet.json
README-SPECS-SYSTEM.md
```

`install-specs-system.sh`, `package-json-snippet.json`, dan
`README-SPECS-SYSTEM.md` boleh disimpan di root repository atau dipindahkan
ke folder internal tooling setelah proses instalasi selesai.
