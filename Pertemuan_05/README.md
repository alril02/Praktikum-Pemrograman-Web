# Praktikum Pertemuan 5 — Antarmuka Berbasis Komponen dengan Vue

Panduan lengkap: `Materi/Materi_05_Antarmuka_Berbasis_Komponen_dengan_Vue.md` (bagian 5).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil: dist/
npm run preview
```

Prasyarat: Node.js 20+. Ekstensi VS Code: **Vue (Official)**. Ekstensi browser: **Vue DevTools**.

## Struktur

```
src/
├── main.js
├── App.vue                     # pemilik state (9 TODO)
├── style.css
└── components/
    ├── ProductCard.vue         # 6 TODO
    ├── FilterBadge.vue         # 2 TODO
    └── CartCounter.vue         # 2 TODO
public/products.json            # data produk (termasuk satu baris uji XSS)
```

## Urutan Pengerjaan

1. `ProductCard.vue` → komponen paling mandiri
2. `FilterBadge.vue`
3. `CartCounter.vue`
4. `App.vue` → hubungkan semuanya (props down, events up)

## Aturan

- Komponen anak **tidak boleh** memutasi props.
- `v-for` wajib `:key` berupa `id` produk.
- Dilarang memakai `v-html` untuk data produk.
- Pembersihan: request dibatalkan di `onUnmounted`.

## Skenario Uji

| Skenario | Hasil |
| :--- | :--- |
| Tambah 3x produk stok 12 | Penghitung 3, total sesuai |
| Produk stok 0 | Tombol nonaktif, "Habis" |
| Tambah melebihi stok | Tombol nonaktif ("Stok penuh di keranjang") |
| Klik badge kategori | Daftar terfilter, `aria-pressed="true"` |
| Ketik kata cari | Daftar menyempit |
| Produk ber-HTML (id 11) | Tampil sebagai teks |
| Ubah nama file jadi `products-x.json` | Keadaan error tampil dengan pesan |

## Checklist Pengumpulan

- [ ] Seluruh TODO selesai, tidak ada warning di konsol
- [ ] `npm run build` sukses
- [ ] Screenshot Vue DevTools menunjukkan pohon komponen dan props
- [ ] Commit Conventional dan Pull Request
