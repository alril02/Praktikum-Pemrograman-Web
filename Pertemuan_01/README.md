# Praktikum Pertemuan 1 — Fondasi Arsitektur Web & Protokol Komunikasi

Panduan lengkap ada di `Materi/Materi_01_Fondasi_Arsitektur_Web_dan_Protokol_Komunikasi.md` (bagian 5).

## Isi Folder

| Berkas | Fungsi |
| :--- | :--- |
| `http-inspector-server.js` | Server HTTP tanpa dependensi untuk mengamati request/response mentah |
| `curl-cheatsheet.md` | Daftar perintah cURL dan eksperimen terarah |
| `laporan-http-template.md` | Templat laporan analisis HTTP situs publik |
| `.gitignore.contoh` | Contoh `.gitignore` untuk proyek Node |

## Cara Menjalankan

```bash
node http-inspector-server.js
# buka terminal lain
curl.exe -i http://localhost:3000/
```

Prasyarat: Node.js 20+ dan Git terpasang.

## Checklist Pengumpulan

- [ ] Repositori `toko-umkm` ada di GitHub dengan `.gitignore` yang benar
- [ ] Minimal 4 commit dengan format Conventional Commits
- [ ] Branch `laporan/analisis-http` dan Pull Request ke `main`
- [ ] Laporan analisis HTTP terisi lengkap beserta bukti
- [ ] Tautan Pull Request dikumpulkan di LMS
