# Praktikum Pertemuan 9 — Perutean SPA & Manajemen State Global

Panduan lengkap: `Materi/Materi_09_Perutean_SPA_dan_Manajemen_State_Global.md` (bagian 5).

Proyek ini **menggantikan** frontend pertemuan 5 dan mengonsumsi backend pertemuan 6/7.

## Menjalankan

```bash
npm install
cp .env.example .env         # Windows: copy .env.example .env
npm run dev                  # http://localhost:5173
npm test                     # uji logika store tanpa browser
npm run build && npm run preview
```

Backend harus berjalan di `http://localhost:3000` (`npm run dev` pada proyek pertemuan 7). CORS backend sudah mengizinkan `http://localhost:5173`.

## Struktur dan TODO

| Berkas | TODO | Fokus |
| :--- | :---: | :--- |
| `src/stores/cart.js` | 10 | Pinia: getter, action, persistensi tervalidasi (diuji `npm test`) |
| `src/router/index.js` | 7 | Lazy route, `props: true`, guard, 404, scroll, judul |
| `src/views/KatalogView.vue` | 1 | Filter pada `route.query` |
| `src/views/ProdukDetailView.vue` | 1 | `watch(() => props.id)` + abort |
| `src/views/CheckoutView.vue` | 1 | Kirim pesanan, tangani 409/422 |
| `src/App.vue` | 1 | Fokus + pengumuman rute |

## Urutan Pengerjaan

1. `stores/cart.js` → `npm test` sampai semua LULUS.
2. `router/index.js`.
3. `KatalogView` (filter di URL) dan `ProdukDetailView`.
4. `CheckoutView`.
5. Aksesibilitas SPA di `App.vue`.

## Skenario Uji Manual

| Skenario | Hasil |
| :--- | :--- |
| Klik tautan antar halaman | Tab Network tidak memuat dokumen baru |
| Muat ulang `/produk/3` | Halaman benar |
| Ubah filter, muat ulang, tekan Back | Filter dipertahankan di URL |
| `/checkout` dengan keranjang kosong | Dialihkan ke `/keranjang?info=kosong` |
| `/abc` | Halaman 404 |
| Tambah produk lalu muat ulang | Keranjang tetap |
| Checkout stok tidak cukup | Pesan 409 jelas, keranjang tetap |
| Navigasi keyboard | Fokus ke `<main>`, judul berubah |

## Checklist Pengumpulan

- [ ] `npm test` seluruhnya LULUS (12 pengecekan)
- [ ] `npm run build` sukses
- [ ] Semua skenario uji manual terpenuhi
- [ ] Commit Conventional dan Pull Request

## Catatan untuk Dosen

Folder `_solusi_dosen/` berisi `cart.js` dan `router-index.js` (kunci jawaban). **Jangan dibagikan** sebelum tenggat.
