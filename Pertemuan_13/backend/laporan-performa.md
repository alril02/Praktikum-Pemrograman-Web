# Laporan Performa — [Nama Mahasiswa / NIM]

**Tanggal:** …
**Mesin:** CPU … / RAM … / OS …
**Versi Node.js:** …

> Ukur setiap skenario **minimal 3 kali**; catat median. Gunakan data dan kondisi yang sama sebelum dan sesudah.

## 1. Antrean: latensi respons webhook

| Skenario | Percobaan 1 | Percobaan 2 | Percobaan 3 | Median |
| :--- | ---: | ---: | ---: | ---: |
| Sebelum: email & invoice di dalam request (ms) | | | | |
| Sesudah: dengan antrean (ms) | | | | |

Perintah pengukuran: `…`

Analisis (2–4 kalimat): …

## 2. API: `GET /api/v1/produk?batas=100`

Perintah: `node scripts/bench.mjs "http://localhost:3000/api/v1/produk?batas=100" 300 20`

| Metrik | Baseline | + Cache | + Cache + gzip |
| :--- | ---: | ---: | ---: |
| Throughput (req/s) | | | |
| p50 (ms) | | | |
| p95 (ms) | | | |
| p99 (ms) | | | |
| Ukuran respons (KB) | | | |
| Cache HIT (%) | | | |

## 3. Frontend (Lighthouse, Mobile) — satu perbaikan

Halaman: …  Perbaikan yang dilakukan: …

| Metrik | Sebelum | Sesudah |
| :--- | ---: | ---: |
| Performance score | | |
| LCP (s) | | |
| CLS | | |
| INP / TBT | | |
| Total byte gambar (KB) | | |

## 4. Kompromi dan risiko

| Optimasi | Manfaat | Risiko / harga |
| :--- | :--- | :--- |
| Antrean | | |
| Cache TTL … detik | | |
| Kompresi | | |

## 5. Kesimpulan

…
