# Praktikum Pertemuan 11 — Integrasi Client-Server & Manajemen Formulir

Panduan lengkap: `Materi/Materi_11_Integrasi_Client_Server_dan_Manajemen_Formulir.md` (bagian 5).

Dua proyek:

| Folder | Isi |
| :--- | :--- |
| `backend/` | Backend pertemuan 10 (autentikasi selesai) + **validasi Zod** + **unggah gambar aman** |
| `frontend/` | SPA pertemuan 9 + **lapisan API dengan interceptor**, **store auth**, **login**, **form admin** |

> Berkas pertemuan 9/10 yang tidak berubah disertakan apa adanya agar proyek dapat dijalankan. Bila Anda melanjutkan repositori sendiri, **gabungkan** hanya berkas baru/berubah dan pertahankan `prisma/migrations`.

---

## Backend

```bash
cd backend
npm install
cp .env.example .env                       # isi JWT_SECRET (>= 32 karakter)
npx prisma migrate dev --name tambah-gambar-produk
npm run db:seed
npm test                                   # uji deteksiGambar (magic bytes)
npm run dev                                # http://localhost:3000
npm run smoke                              # terminal lain
```

| Berkas | TODO | Fokus |
| :--- | :---: | :--- |
| `src/validation/produk.schema.js` | 3 | Skema Zod `.strict()`, pesan Indonesia, `parse()` |
| `src/utils/deteksiGambar.js` | 1 | Magic bytes JPEG/PNG/WebP |
| `src/controllers/gambar.controller.js` | 1 (7 langkah) | Validasi isi, nama UUID, simpan, hapus berkas lama |

Smoke test: **19 pengecekan** (validasi + unggahan + keamanan jalur statis).

---

## Frontend

```bash
cd frontend
npm install
cp .env.example .env                       # VITE_API_BASE=http://localhost:3000/api/v1
npm test                                   # uji api, validasi, auth store, path aman
npm run dev                                # http://localhost:5173
npm run build
```

| Berkas | TODO | Fokus |
| :--- | :---: | :--- |
| `src/api.js` | 3 | Interceptor Authorization, FormData, 401 single-flight, `ApiError.galatField` |
| `src/stores/auth.js` | 3 | `login`, `logout`, `adalahAdmin` |
| `src/lib/validasiProduk.js` | 1 | Validasi klien yang selaras dengan server |
| `src/lib/aman.js` | 1 | `pathInternal()` (cegah open redirect) |
| `src/views/AdminProdukView.vue` | 4 | `simpan`, `hapus`, `unggah`, `fokusGalat` |

---

## Urutan Pengerjaan

1. Backend: `deteksiGambar` → `npm test`; skema Zod; `gambar.controller` → `npm run smoke`.
2. Frontend: `lib/aman.js`, `lib/validasiProduk.js`, `api.js`, `stores/auth.js` → `npm test`.
3. `AdminProdukView.vue`; uji manual sesuai tabel pada modul.

## Checklist Pengumpulan

- [ ] `backend: npm test` dan `npm run smoke` seluruhnya LULUS
- [ ] `frontend: npm test` seluruhnya LULUS dan `npm run build` sukses
- [ ] Tidak ada `fetch` langsung di komponen/view
- [ ] Form: label, `aria-invalid`, ringkasan galat, fokus berpindah
- [ ] `uploads/` tidak ter-commit (kecuali `.gitkeep`)
- [ ] Commit Conventional dan Pull Request

## Catatan untuk Dosen

`backend/_solusi_dosen/` dan `frontend/_solusi_dosen/` berisi kunci jawaban. **Jangan dibagikan** sebelum tenggat.
