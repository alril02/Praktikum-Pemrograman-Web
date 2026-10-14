# Runbook Operasional — Toko UMKM

**Pemilik:** … **Terakhir diperbarui:** …

## 1. Ringkasan Arsitektur

| Komponen | Platform | URL / Lokasi | Catatan |
| :--- | :--- | :--- | :--- |
| Frontend (SPA) | … | https://… | Build: `npm run build` → `dist/` |
| API | … | https://api.… | `node src/server.js` |
| Worker | … | — | `node src/queue/worker-main.js` |
| Database | … | — | PostgreSQL; backup … |
| DNS | … | — | CNAME/A … |
| Gateway pembayaran | … | — | Webhook → `/api/v1/webhook/gateway` |

## 2. Variabel Lingkungan (tanpa nilai rahasia)

| Variabel | Sumber | Rotasi terakhir |
| :--- | :--- | :--- |
| `JWT_SECRET` | secret manager / panel PaaS | … |
| `DATABASE_URL` | panel PaaS | … |
| `GATEWAY_API_KEY` | panel gateway | … |
| `GATEWAY_WEBHOOK_SECRET` | panel gateway | … |

## 3. Prosedur Rilis

1. Pastikan PR digabung dan CI hijau.
2. (Bila ada migrasi) pastikan migrasi **kompatibel mundur** (expand/contract).
3. Deploy otomatis berjalan dari `main`; setujui pada Environment `production` bila diminta.
4. Verifikasi: `node backend/scripts/smoke-produksi.mjs https://api.…`
5. Pantau log dan error rate selama 15 menit.

## 4. Rollback

| Langkah | Detail |
| :--- | :--- |
| Kapan | Smoke test gagal, error rate naik, atau `/siap` tidak 200 setelah rilis |
| Cara cepat | PaaS: *Rollback/Redeploy* ke rilis sebelumnya pada panel |
| Cara lain | Jalankan ulang workflow `Deploy` (workflow_dispatch) pada commit/tag sebelumnya |
| Database | Migrasi **tidak** di-rollback otomatis; karena expand/contract, versi lama tetap kompatibel |
| Setelah rollback | Catat insiden, buat isu perbaikan, tambahkan tes yang mencegahnya |

## 5. Pemecahan Masalah

| Gejala | Pemeriksaan | Tindakan |
| :--- | :--- | :--- |
| `/siap` 503 | Log; koneksi DB; `DATABASE_URL` | Pulihkan DB / perbaiki variabel |
| Frontend 404 saat muat ulang | Aturan fallback SPA | Pasang rewrite `/* → /index.html` |
| CORS error pada browser | `CORS_ORIGINS` | Isi dengan origin frontend (https) |
| Webhook 401 | `GATEWAY_WEBHOOK_SECRET`, jam server | Samakan rahasia; periksa NTP |
| Job menumpuk | Layanan worker hidup? `/api/v1/admin/jobs?status=gagal` | Restart worker; periksa DLQ |
| Sertifikat kedaluwarsa | Tanggal sertifikat; ACME | Perbarui; periksa cron certbot/PaaS |

## 6. Latihan Rollback (isi saat praktikum)

| Item | Hasil |
| :--- | :--- |
| Rilis yang sengaja dirusak (commit) | … |
| Waktu sejak deploy hingga gejala terdeteksi | … |
| Waktu hingga pemulihan penuh | … |
| Apa yang mendeteksi masalah? | health check / smoke test / pengguna |
| Perbaikan proses | … |
