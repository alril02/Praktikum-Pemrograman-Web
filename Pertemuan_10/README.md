# Praktikum Pertemuan 10 — Keamanan Web & Autentikasi

Panduan lengkap: `Materi/Materi_10_Keamanan_Web_dan_Autentikasi.md` (bagian 5).

Proyek ini melanjutkan backend pertemuan 7: produk dan pesanan sudah selesai; yang Anda kerjakan adalah lapisan **autentikasi, otorisasi, dan perlindungan**.

## Menjalankan

```bash
npm install
cp .env.example .env                                  # Windows: copy .env.example .env
# isi JWT_SECRET (>= 32 karakter acak):
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

npx prisma migrate dev --name tambah-autentikasi     # migrasi #3
npm run db:seed                                       # akun demo + data
npm run dev                                           # http://localhost:3000
npm run smoke                                         # terminal lain
```

> Server **menolak start** jika `JWT_SECRET` kosong atau < 32 karakter (fail fast).

## Akun Demo (seed — hanya untuk pelatihan)

| Email | Sandi | Peran |
| :--- | :--- | :--- |
| `admin@contoh.id` | `AdminRahasia#2026` | admin |
| `budi@contoh.id` | `BudiRahasia#2026` | user |
| `sari@contoh.id` | `SariRahasia#2026` | user |

## TODO (urutan pengerjaan)

| Berkas | TODO | Fokus |
| :--- | :---: | :--- |
| `src/services/auth.service.js` | 4 | bcrypt hash/verify, JWT sign/verify (pin algoritma) |
| `src/middleware/auth.js` | 2 | `autentikasi`, `otorisasi` |
| `src/controllers/auth.controller.js` | 3 | daftar, masuk (pesan generik), saya |
| `src/routes/produk.routes.js` | 1 | Tulis hanya admin |
| `src/routes/pesanan.routes.js` | 1 | Wajib login |
| `src/controllers/pesanan.controller.js` | 3 | Kepemilikan + identitas dari token |
| `src/app.js` | 2 | `helmet()`, pembatas laju login |

## Tabel Uji Serangan Manual (isi untuk laporan)

| Percobaan | Diharapkan | Hasil Anda |
| :--- | :--- | :--- |
| `POST /produk` tanpa token | 401 | |
| `POST /produk` token user | 403 | |
| JWT dimodifikasi 1 karakter | 401 | |
| JWT `alg: none` | 401 | |
| Baca pesanan milik user lain | 404 | |
| Daftar dengan `"peran":"admin"` | Peran tetap `user` | |
| 30 login salah beruntun | 429 | |
| Email tak ada vs sandi salah | Respons identik | |

## Checklist Pengumpulan

- [ ] `npm run smoke` seluruhnya LULUS (26 pengecekan)
- [ ] `.env` tidak ter-commit; `JWT_SECRET` tidak ada di repositori
- [ ] `npm audit --omit=dev` dijalankan; hasil dilampirkan
- [ ] Tabel uji serangan manual terisi
- [ ] Commit Conventional dan Pull Request

## Catatan untuk Dosen

Folder `_solusi_dosen/` berisi kunci jawaban (`auth.service.js`, `auth.js`, `auth.controller.js`, `produk.routes.js`, `pesanan.routes.js`, `pesanan.controller.js`, `app.js`). **Jangan dibagikan** sebelum tenggat.

Dependensi autentikasi memakai `bcryptjs` (JavaScript murni, tanpa kompilasi native) agar pemasangan mudah di semua mesin pelatihan. Untuk produksi pertimbangkan `argon2` (Argon2id).
