# Agent Response Format

Dokumen ini mendefinisikan format respons yang harus dipakai AI coding agent ketika mengerjakan sprint/task di project ini.

Walaupun file ini berada di folder sprint, tujuannya adalah memastikan semua output dari AI agent mudah diaudit, mudah dilanjutkan, dan tidak merusak konteks project.

## Standard Response Format

Setiap kali AI agent menyelesaikan task, gunakan format:

```md
# Task Result

## Summary
Ringkasan singkat perubahan.

## Files Changed
| File | Change |
|---|---|
| path/file.js | What changed |

## Implementation Notes
Penjelasan teknis penting.

## Tests
- [ ] Unit test
- [ ] Integration test
- [ ] Manual smoke test

## Risks
Hal yang masih berisiko atau perlu dicek.

## Next Recommended Step
Task berikutnya yang paling masuk akal.
```

## Required Rules

AI agent harus:

- Menyebut file yang diubah.
- Menjelaskan alasan perubahan.
- Tidak mengklaim test lulus jika tidak menjalankannya.
- Tidak menghapus behavior existing tanpa explicit approval.
- Menjaga Telegram webhook, inbox, AI reply, dan human takeover tetap bekerja.
- Menandai breaking change dengan jelas.

## Forbidden Output

AI agent tidak boleh hanya menjawab:

```txt
Done
Fixed
Implemented
```

Tanpa bukti file, alasan, dan test.

## Commit Message Format

Gunakan format:

```txt
scope: short imperative summary
```

Contoh:

```txt
security: protect orders and complaints routes
commerce: add product catalog repository
telegram: add inline keyboard cart actions
payments: add sandbox payment webhook handler
```
