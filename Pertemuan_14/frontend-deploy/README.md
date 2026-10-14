# Konfigurasi Deploy Frontend (SPA Vue)

Salin **satu** berkas sesuai penyedia hosting ke proyek `frontend/`:

| Penyedia | Berkas | Lokasi tujuan | Catatan |
| :--- | :--- | :--- | :--- |
| Netlify | `netlify.toml` (atau `_redirects`) | akar `frontend/` (atau `frontend/public/` untuk `_redirects`) | Fallback SPA + cache aset |
| Vercel | `vercel.json` | akar `frontend/` | Rewrites + header |
| Cloudflare Pages | `_redirects` | `frontend/public/` | Sama dengan Netlify |
| GitHub Pages | — | — | Tidak mendukung rewrite; gunakan mode **hash** pada router atau 404.html salinan index |
| Nginx (VPS) | `../deploy/nginx.conf` | server | Lihat `try_files` |

## Variabel lingkungan build

| Variabel | Nilai produksi | Catatan |
| :--- | :--- | :--- |
| `VITE_API_BASE` | `https://api.<domain>/api/v1` | **Publik** (tertanam di bundel). Jangan isi rahasia. |

## Verifikasi

1. Buka `https://<domain>/produk/3` langsung (bukan lewat klik) → halaman tampil (bukan 404).
2. DevTools → Network: berkas `assets/*.js` bernama ber-hash dan `cache-control: immutable`.
3. Tidak ada error CORS pada Console (pastikan `CORS_ORIGINS` backend berisi origin frontend).
4. Lighthouse (Mobile): catat skor Performance/SEO/Accessibility pada laporan.
