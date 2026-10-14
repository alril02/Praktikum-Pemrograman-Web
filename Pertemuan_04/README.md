# Praktikum Pertemuan 4 — JavaScript Asinkron & Konsumsi Data

Panduan lengkap: `Materi/Materi_04_JavaScript_Asinkron_dan_Konsumsi_Data.md` (bagian 5).

## Isi Folder

| Berkas | Fungsi |
| :--- | :--- |
| `latihan-promise.js` | 5 latihan Promise/async dengan pengecekan otomatis |
| `mock-api.js` | API tiruan (Node bawaan, tanpa dependensi) dengan simulasi lambat/gagal/rusak |
| `products.json` | Sumber data produk untuk API tiruan |
| `api.js` | Lapisan akses jaringan (2 TODO) |
| `app.js` | Katalog berbasis fetch (5 TODO) |
| `index.html` | Halaman (sudah jadi) |

## Menjalankan

```bash
# 1. Latihan promise
node latihan-promise.js

# 2. API tiruan (terminal 1)
node mock-api.js            # http://localhost:4000/api/produk

# 3. Halaman (terminal 2)
npx serve .                 # buka alamat yang tampil, mis. http://localhost:3000
```

> Origin yang diizinkan CORS pada `mock-api.js`: `localhost:3000`, `5173`, `8080`. Bila `npx serve` memakai port lain, tambahkan ke `ORIGINS_DIIZINKAN`.

## Parameter Simulasi

| Parameter | Efek |
| :--- | :--- |
| `?delay=2000` | Tunda respons 2 detik |
| `?gagal=500` | Kembalikan status 500 |
| `?acak=1` | Gagal 50% (untuk menguji coba ulang) |
| `?json_rusak=1` | Body bukan JSON valid |
| `?kosong=1` | Array kosong |

Untuk menguji, ubah sementara path di `app.js` atau panggil langsung dengan cURL.

## Skenario Uji Wajib

| Skenario | Hasil yang diharapkan |
| :--- | :--- |
| Muat normal | Loading singkat lalu daftar tampil |
| Server dimatikan | Pesan "Tidak dapat terhubung…" + tombol Coba lagi |
| Status 500 | Coba ulang otomatis, lalu pesan error |
| JSON rusak | Pesan "Data dari server tidak dapat dibaca." |
| Ketik cepat | Hanya hasil permintaan terakhir tampil |
| Pencarian tanpa hasil | "Produk tidak ditemukan." |

## Checklist Pengumpulan

- [ ] `latihan-promise.js` seluruh pengecekan LULUS
- [ ] `api.js` melempar `ApiError` dengan `jenis` yang tepat
- [ ] Empat keadaan UI tampil dengan benar
- [ ] Request lama dibatalkan saat pencarian berubah
- [ ] Commit Conventional dan Pull Request
