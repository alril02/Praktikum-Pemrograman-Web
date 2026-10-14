# Checklist Aksesibilitas & SEO — Landing Page UMKM

**Nama / NIM:** …
**URL/Berkas:** …

Centang setelah diverifikasi. Lampirkan tangkapan layar Lighthouse pada Pull Request.

## A. Struktur Semantik
- [ ] `<html lang="id">`
- [ ] Tepat satu `<h1>`, heading berurutan tanpa lompat level
- [ ] Landmark: `header`, `nav`, `main` (satu), `footer`
- [ ] Setiap `nav` memiliki `aria-label` bila lebih dari satu
- [ ] Kartu produk memakai `<article>`
- [ ] Tidak ada `<div>`/`<span>` yang diberi `onclick` sebagai pengganti tombol atau tautan
- [ ] HTML lolos validator W3C tanpa error

## B. Aksesibilitas
- [ ] Semua gambar informatif memiliki `alt` bermakna; dekoratif `alt=""`
- [ ] Rasio kontras teks ≥ 4,5 : 1 (teks besar ≥ 3 : 1)
- [ ] Setiap input memiliki `<label for>` yang cocok
- [ ] `autocomplete` benar pada nama dan email
- [ ] Skip link berfungsi dan tampil saat fokus
- [ ] Indikator fokus terlihat pada semua kontrol
- [ ] Seluruh fungsi dapat dioperasikan hanya dengan keyboard
- [ ] Target sentuh ≥ 44 × 44 CSS px untuk tombol/tautan utama

## C. SEO
- [ ] `<title>` unik dan deskriptif
- [ ] `meta description` 120–160 karakter
- [ ] Open Graph: title, description, image, type, url
- [ ] Teks tautan deskriptif (tidak ada "klik di sini")

## D. Responsif dan Performa
- [ ] `meta viewport` terpasang
- [ ] Tidak ada scroll horizontal pada lebar 320 px
- [ ] Grid produk menyesuaikan jumlah kolom tanpa media query
- [ ] Gambar memiliki `width`/`height`; gambar di bawah lipatan `loading="lazy"`; gambar hero tidak lazy

## E. Hasil Lighthouse (Mobile)

| Kategori | Skor | Catatan perbaikan |
| :--- | :---: | :--- |
| Performance | | |
| Accessibility | | |
| Best Practices | | |
| SEO | | |

## F. Refleksi (3–5 kalimat)

Temuan Lighthouse yang paling sulit diperbaiki dan cara Anda menyelesaikannya:

…
