# Praktikum Pertemuan 2 — Struktur, Semantik, dan Aksesibilitas Web

Panduan lengkap: `Materi/Materi_02_Struktur_Semantik_dan_Aksesibilitas_Web.md` (bagian 5).

## Isi Folder

| Berkas | Fungsi |
| :--- | :--- |
| `index.html` | Kerangka landing page berisi div-soup yang harus dijadikan semantik (TODO 1–15) |
| `styles.css` | Gaya mobile-first dengan TODO untuk Grid, fokus, dan media query |
| `warmup.js` | Pemanasan JavaScript 15 menit dengan pengecekan otomatis |
| `checklist-a11y.md` | Daftar periksa aksesibilitas, SEO, dan hasil Lighthouse |

## Menjalankan

```bash
# Pemanasan JS
node warmup.js

# Halaman: buka dengan ekstensi Live Server di VS Code,
# atau jalankan server statis sederhana:
npx serve .
```

## Target Penilaian

- Lighthouse (Mobile): Accessibility > 90 dan SEO > 90
- Navigasi keyboard penuh, skip link berfungsi
- Tidak ada scroll horizontal pada 320 px

## Pengumpulan

```bash
git switch -c fitur/landing-page
git add landing/
git commit -m "feat(landing): tambah landing page semantik dan responsif"
git push -u origin fitur/landing-page
```

Lampirkan tangkapan layar Lighthouse dan `checklist-a11y.md` pada Pull Request.
