# Praktikum Pertemuan 3 — Dasar JavaScript & Manipulasi DOM

Panduan lengkap: `Materi/Materi_03_Dasar_JavaScript_dan_Manipulasi_DOM.md` (bagian 5).

## Isi Folder

| Berkas | Fungsi |
| :--- | :--- |
| `latihan-array.js` | 6 latihan `map/filter/reduce/sort` dengan pengecekan otomatis |
| `demo-xss.html` | Demonstrasi `innerHTML` vs `textContent` |
| `index.html`, `styles.css` | Kerangka dan gaya katalog (sudah jadi) |
| `products.js` | Data produk (termasuk satu baris uji XSS) |
| `app.js` | **Berkas utama**: 7 TODO yang harus diselesaikan |

## Menjalankan

```bash
# 1. Latihan array
node latihan-array.js

# 2. Demo XSS: buka demo-xss.html langsung di browser

# 3. Katalog (ES Module butuh server, bukan file://)
npx serve .
# lalu buka alamat yang ditampilkan, mis. http://localhost:3000
```

## Aturan

- Tidak boleh memakai `innerHTML`, `outerHTML`, atau `insertAdjacentHTML` untuk data produk.
- Satu listener `click` saja pada `#daftar-produk` (delegasi).
- Baris produk ber-HTML (`id: 11`) harus tampil sebagai teks biasa.

## Checklist Pengumpulan

- [ ] `latihan-array.js` semua 8 pengecekan LULUS (8/8)
- [ ] Katalog: filter kategori, pencarian, keranjang, tombol nonaktif saat stok 0
- [ ] Tidak ada `innerHTML` pada data dinamis
- [ ] Commit Conventional, Pull Request dengan tangkapan layar/GIF

