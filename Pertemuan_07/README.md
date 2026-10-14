# Praktikum Pertemuan 7 — Pemodelan Data & Interaksi Basis Data (Prisma)

Panduan lengkap: `Materi/Materi_07_Pemodelan_Data_dan_Interaksi_Basis_Data_Prisma.md` (bagian 5).

Proyek ini **menggantikan** backend pertemuan 6: kontrak API sama, penyimpanan diganti SQLite via Prisma, dan ditambah entitas pengguna/pesanan.

## Menjalankan

```bash
npm install
cp .env.example .env                      # Windows: copy .env.example .env
npx prisma migrate dev --name init        # buat database + migrasi awal
npm run db:seed                           # isi data awal
npm run dev                               # http://localhost:3000
npx prisma studio                         # lihat data (http://localhost:5555)
npm run smoke                             # terminal lain
```

Reset data lokal: `npm run db:reset` (menghapus database, menerapkan ulang migrasi, menjalankan seed).

## Struktur

```
prisma/
├── schema.prisma             # model (1 TODO: migrasi #2)
├── seed.js                   # seeder idempoten
└── migrations/               # dibuat oleh `migrate dev` -> WAJIB di-commit
src/
├── lib/prisma.js             # satu PrismaClient + penghitung kueri
├── repositories/
│   ├── produk.repo.js        # 6 TODO
│   └── pesanan.repo.js       # 3 TODO (N+1 dan transaksi)
├── controllers/              # memakai repositori
├── routes/
└── middleware/errorHandler.js   # memetakan P2002/P2003/P2025 -> 409/409/404
smoke-test.mjs               # 29 pengecekan wajib (19 produk + 10 pesanan) + 1 bonus
```

## Urutan Pengerjaan

1. Baca `schema.prisma`, gambar ERD di `docs/erd.md` (Mermaid).
2. Jalankan migrasi awal + seed; amati SQL di `prisma/migrations/*/migration.sql`.
3. `produk.repo.js` TODO 1–6 → uji bagian A smoke test.
4. Bandingkan `GET /api/v1/pesanan?mode=buruk` vs default → header `X-Jumlah-Query`.
5. `pesanan.repo.js` TODO 1 (N+1), TODO 2, TODO 3 (transaksi) → uji bagian B.
6. **Migrasi #2:** tambah `deskripsi String?`, jalankan `migrate dev`, perbarui controller & repositori.

## Kode Galat Prisma → HTTP

| Kode | Arti | HTTP |
| :--- | :--- | :---: |
| P2002 | Unique dilanggar | 409 |
| P2003 | Foreign key dilanggar | 409 |
| P2025 | Rekaman tidak ditemukan | 404 |

## Checklist Pengumpulan

- [ ] `npm run db:reset` lalu `npm run smoke` → seluruh pengecekan wajib LULUS
- [ ] Folder `prisma/migrations/` di-commit (≥ 2 migrasi), `*.db` tidak
- [ ] `docs/erd.md` berisi ERD
- [ ] Laporan singkat: jumlah kueri versi buruk vs baik
- [ ] Commit Conventional dan Pull Request

## Catatan untuk Dosen

Folder `_solusi_dosen/` berisi kunci jawaban repositori (`produk.repo.js`, `pesanan.repo.js`). **Jangan dibagikan** sebelum tenggat; hapus dari salinan yang didistribusikan.

Proyek ini memakai **Prisma 6** (`prisma-client-js`, `url` pada `datasource`). Prisma 7 memperkenalkan perubahan konfigurasi (`prisma.config.ts`, adapter driver); bila ingin memakai versi tersebut, sesuaikan sesuai panduan migrasi resmi.
