# Praktikum Pertemuan 6 — REST API dengan Express

Panduan lengkap: `Materi/Materi_06_Server_Side_dan_Arsitektur_RESTful_API_Express.md` (bagian 5).

## Menjalankan

```bash
npm install
cp .env.example .env          # Windows: copy .env.example .env
npm run dev                   # http://localhost:3000
npm run smoke                 # terminal lain, setelah server aktif
```

Prasyarat: Node.js 20.6+ (mendukung `--env-file`).

## Struktur

```
src/
├── server.js                 # listen
├── app.js                    # middleware + route (1 TODO)
├── routes/produk.routes.js
├── controllers/produk.controller.js   # 5 TODO
├── middleware/
│   ├── logger.js
│   ├── notFound.js           # 1 TODO
│   └── errorHandler.js       # 3 TODO
├── data/produk.store.js      # penyimpanan in-memory
└── utils/httpError.js
smoke-test.mjs               # 26 pengecekan kontrak API
requests.http                # koleksi REST Client
```

## Urutan Pengerjaan

1. `notFound.js` dan `errorHandler.js`
2. `buat` (POST) → uji `smoke`
3. `ganti` (PUT), `ubah` (PATCH), `hapus` (DELETE)
4. `daftar`: filter, urut, paginasi
5. CORS pada `app.js`

## Tabel Kontrak Singkat

| Operasi | Method + URL | Sukses | Gagal |
| :--- | :--- | :---: | :--- |
| Daftar | `GET /api/v1/produk` | 200 | 400 (param) |
| Detail | `GET /api/v1/produk/:id` | 200 | 400, 404 |
| Buat | `POST /api/v1/produk` | 201 + Location | 400 (JSON), 422 |
| Ganti | `PUT /api/v1/produk/:id` | 200 | 404, 422 |
| Ubah | `PATCH /api/v1/produk/:id` | 200 | 404, 422 |
| Hapus | `DELETE /api/v1/produk/:id` | 204 | 404 |

## Checklist Pengumpulan

- [ ] `npm run smoke` menunjukkan seluruh pengecekan LULUS
- [ ] `requests.http` atau koleksi Postman diekspor ke repositori
- [ ] `.env` tidak ter-commit; `.env.example` ada
- [ ] Commit Conventional dan Pull Request

## Catatan untuk Dosen

Folder _solusi_dosen/ berisi kunci jawaban yang lolos 26/26 smoke test. **Jangan dibagikan** ke mahasiswa; hapus folder ini dari salinan yang didistribusikan.
