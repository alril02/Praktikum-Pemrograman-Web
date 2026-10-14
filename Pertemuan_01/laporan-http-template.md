# Laporan Analisis HTTP — [Nama Situs]

**Nama:** …
**NIM:** …
**Tanggal pengamatan:** …
**URL yang dianalisis:** …

> Lampirkan bukti: potongan output `curl -v`, tangkapan layar DevTools (Network → Headers/Timing).

## 1. DNS

| Item | Hasil |
| :--- | :--- |
| Alamat IP (A/AAAA) | |
| Record CNAME (jika ada) | |
| Name server (NS) | |
| Perintah yang dipakai | |

## 2. Koneksi dan Protokol

| Item | Hasil |
| :--- | :--- |
| Versi HTTP (HTTP/1.1 / h2 / h3) | |
| Versi TLS | |
| Penerbit sertifikat (CA) | |
| Masa berlaku sertifikat | |

## 3. Request

```http
(tempel request line + header penting yang dikirim browser)
```

Jelaskan fungsi 3 header request: …

## 4. Response

```http
(tempel status line + header respons)
```

| Header respons | Nilai | Fungsi |
| :--- | :--- | :--- |
| | | |
| | | |
| | | |

## 5. Pengalihan dan Keamanan

- Apakah `http://` dialihkan ke `https://`? Kode status: …
- Header keamanan yang ditemukan (HSTS, CSP, X-Content-Type-Options, dll.): …

## 6. Caching

| Item | Hasil |
| :--- | :--- |
| `Cache-Control` | |
| `ETag` / `Last-Modified` | |
| Hasil request ulang (200 / 304 / from cache) | |

## 7. Timing (satu request dokumen utama)

| Fase | Waktu (ms) |
| :--- | ---: |
| DNS Lookup | |
| Initial connection | |
| SSL | |
| Waiting (TTFB) | |
| Content Download | |

## 8. Kesimpulan

Tuliskan 3–5 kalimat: bagian mana yang paling memengaruhi waktu muat, dan satu hal yang menurut Anda dapat ditingkatkan oleh pemilik situs.
