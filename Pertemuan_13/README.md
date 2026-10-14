# Praktikum Pertemuan 13 — Pemrosesan Asinkron Latar Belakang & Optimasi Performa

Panduan lengkap: `Materi/Materi_13_Pemrosesan_Asinkron_Latar_Belakang_dan_Optimasi_Performa.md` (bagian 5).

Mode: **demo → terpandu**. Antrean memakai **tabel database** (tanpa Redis); konsepnya identik dengan BullMQ/SQS.

## Menjalankan

```bash
# Terminal 1 — mock gateway (dari pertemuan 12)
cd ../Pertemuan_12/mock-gateway && node --env-file=.env server.js     # :4100

# Terminal 2 — backend
cd backend
npm install
cp .env.example .env              # isi JWT_SECRET; GATEWAY_* sama dengan mock-gateway
npx prisma migrate dev --name tambah-antrean
npm run db:seed
npm test                          # uji cache + antrean (hentikan worker/API lebih dulu)
npm run dev                       # API :3000

# Terminal 3 — worker (proses terpisah!)
cd backend && npm run worker

# Terminal 4
cd backend && npm run smoke
```

> **Catatan uji:** `npm test` memanipulasi tabel `Job`; jalankan **sebelum** worker/API dinyalakan atau pada database terpisah. `npm run db:reset` mengembalikan keadaan bersih.

## TODO (urutan pengerjaan)

| Berkas | TODO | Fokus |
| :--- | :---: | :--- |
| `src/lib/cache.js` | 4 | `set` (TTL+jitter+eviction), `get`, `hapus`, `hapusAwalan` |
| `src/queue/queue.js` | 6 | backoff, enqueue idempoten (`tx`), klaim atomik, selesai/gagal, pemulihan |
| `src/queue/worker.js` | 2 | `prosesJob`, loop + graceful shutdown |
| `src/queue/handlers.js` | 3 | email idempoten, invoice idempoten, kedaluwarsa (pengayaan) |
| `src/services/pembayaran.service.js` | 1 | **Outbox**: enqueue dalam transaksi |
| `src/controllers/produk.controller.js` | 1 | cache-aside + `X-Cache` + `Cache-Control` |
| `src/app.js` | 1 | `compression()` |

`npm test` (≥ 31 pengecekan) harus LULUS sebelum smoke test end-to-end.

## Alur Praktikum

1. **Demo dosen:** email dikirim sinkron di handler webhook → ukur latensi (≈ `EMAIL_DELAY_MS`).
2. **Terpandu:** selesaikan antrean + worker, ubah service menjadi outbox → ukur lagi.
3. **Optimasi:** baseline `npm run bench -- "http://localhost:3000/api/v1/produk?batas=100" 300 20` → cache → gzip → ukur ulang.
4. Isi `laporan-performa.md`.

## Perilaku Uji Email Palsu

| Alamat penerima | Perilaku |
| :--- | :--- |
| `...+gagal2@...` | Gagal 2 percobaan pertama, berhasil pada ke-3 |
| `...+racun@...` | Selalu gagal → DLQ (`status = gagal`) setelah `JOB_MAX_PERCOBAAN` |
| lainnya | Berhasil setelah `EMAIL_DELAY_MS` |

## Checklist Pengumpulan

- [ ] `npm test` LULUS
- [ ] `npm run smoke` LULUS (16 pengecekan)
- [ ] `laporan-performa.md` terisi dengan angka sebelum–sesudah dan analisis kompromi
- [ ] Worker berhenti dengan rapi pada `Ctrl+C` (pesan "berhenti dengan rapi")
- [ ] Commit Conventional dan Pull Request

## Catatan untuk Dosen

`backend/_solusi_dosen/` berisi kunci jawaban: `queue.js`, `worker.js`, `handlers.js`, `cache.js`, `pembayaran.service.js`, `produk.controller.js`, `app.js`. **Jangan dibagikan** sebelum tenggat.

Untuk produksi dengan trafik tinggi, ganti tabel `Job` dengan BullMQ + Redis; antarmuka `enqueue/klaim/selesai/gagal` memetakan satu-satu (lihat tabel pemetaan pada modul).
