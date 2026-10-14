# Praktikum Pertemuan 15 — Pengujian Perangkat Lunak & Dokumentasi Teknis

Panduan lengkap: `Materi/Materi_15_Pengujian_Perangkat_Lunak_dan_Dokumentasi_Teknis.md` (bagian 5).

| Folder | Isi |
| :--- | :--- |
| `backend/` | Backend pertemuan 14 + **Vitest + Supertest**, **OpenAPI 3.1**, **Swagger UI**, **contract test** |
| `frontend-tests/` | Tes komponen Vue (Vitest + Vue Test Utils + happy-dom) untuk dipasang pada proyek frontend |

## Backend

```bash
cd backend
npm install
cp .env.example .env              # isi JWT_SECRET (hanya untuk dev; tes memakai nilai sendiri)
npm run test                      # seluruh suite (unit + api + contract)
npm run test:unit                 # tercepat
npm run test:api
npm run test:contract
npm run test:coverage             # laporan cakupan (indikator, bukan target)
npm run dev                       # lalu buka http://localhost:3000/api/docs
```

Tes memakai database SQLite **terpisah** (`prisma/test.db`) yang dibuat ulang setiap run (migrasi proyek bila ada, atau `db push` bila belum ada) lalu di-seed. Data produksi/dev tidak tersentuh.

### Struktur

```
backend/
├── openapi.yaml                      # spesifikasi (3 TODO path)
├── vitest.config.mjs
├── src/docs/swagger.js               # Swagger UI + /api/v1/openapi.json
├── src/app.js                        # TODO: panggil pasangDokumentasi(app)
└── tests/
    ├── setup/global.mjs              # DB uji baru + seed
    ├── helpers/{client,openapi}.js   # supertest, login cache, validator skema
    ├── unit/                         # CONTOH: status machine, tanda tangan
    ├── api/
    │   ├── produk.test.js            # CONTOH lengkap (18 tes)
    │   ├── webhook.test.js           # CONTOH lengkap: fetch palsu, HMAC, idempotensi (9 tes)
    │   ├── pesanan.test.js           # TUGAS: 2 contoh + 8 it.todo
    │   └── auth.test.js              # TUGAS: 10 it.todo
    └── contract/contract.test.js     # kelengkapan dokumentasi + validasi skema respons
```

## TODO (urutan pengerjaan)

| # | Berkas | Tugas |
| :-: | :--- | :--- |
| 1 | `tests/api/pesanan.test.js` | Tulis 8 tes (stok, atomik, validasi, 401, konkurensi, daftar per pengguna, IDOR, akses pemilik/admin) |
| 2 | `tests/api/auth.test.js` | Tulis 10 tes (login, daftar, token rusak/none, RBAC) |
| 3 | `openapi.yaml` | Dokumentasikan 3 operasi: `POST /pesanan/{id}/bayar`, `POST /webhook/gateway`, `GET /admin/jobs` |
| 4 | `src/app.js` | Panggil `pasangDokumentasi(app)` **sebelum** `helmet()` |
| 5 | (tambahan) | Satu **tes regresi** untuk bug yang pernah Anda alami; refaktor satu fungsi besar dengan tes hijau |

Kondisi awal: `contract.test.js` **gagal** pada "kelengkapan dokumentasi" dan "Swagger UI" sampai TODO 3–4 selesai. Itu disengaja.

## Frontend

Lihat `frontend-tests/README.md`. Tugas: lengkapi `LoginView.test.js` (5 tes).

## Checklist Pengumpulan

- [ ] `npm run test` hijau (tidak ada `it.todo` tersisa pada `pesanan` dan `auth`)
- [ ] `openapi.yaml` lengkap; Swagger UI berfungsi dengan tombol Authorize
- [ ] Contract test lolos (kelengkapan + skema)
- [ ] Minimal satu tes regresi baru dan satu refaktor aman (commit terpisah)
- [ ] `README.md` portofolio mutakhir (tujuan, arsitektur, cara menjalankan/menguji, tautan docs)
- [ ] Tidak ada `.only` yang ter-commit; `prisma/test.db` dan `coverage/` di `.gitignore`
- [ ] Commit Conventional dan Pull Request

## Catatan untuk Dosen

`backend/_solusi_dosen/` berisi kunci jawaban: `pesanan.test.js`, `auth.test.js`, `openapi.yaml` (lengkap), `app.js`. `frontend-tests/_solusi_dosen/LoginView.test.js`. **Jangan dibagikan** sebelum tenggat.

Kunci jawaban diverifikasi: backend **84 tes** (7 berkas) hijau; frontend **12 tes** hijau.
