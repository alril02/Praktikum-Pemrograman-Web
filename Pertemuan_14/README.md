# Praktikum Pertemuan 14 — Deployment, Lingkungan Server, & CI/CD Dasar

Panduan lengkap: `Materi/Materi_14_Deployment_Lingkungan_Server_dan_CICD.md` (bagian 5).

## Isi Folder

| Folder/Berkas | Fungsi |
| :--- | :--- |
| `backend/` | Backend siap produksi (turunan pertemuan 13): validasi env, health/readiness, graceful shutdown, log JSON, Dockerfile, skrip smoke produksi |
| `.github/workflows/ci.yml` | Templat CI: lint, migrasi+seed, test, audit, build frontend |
| `.github/workflows/deploy.yml` | Templat CD: deploy hook PaaS + menunggu `/siap` + smoke test |
| `deploy/nginx.conf` | Nginx untuk VPS (HTTPS, fallback SPA, proxy API, header keamanan) |
| `deploy/toko-api.service` | Unit systemd |
| `deploy/runbook.md`, `deploy/checklist-rilis.md` | Dokumen operasional (diisi mahasiswa) |
| `frontend-deploy/` | Konfigurasi hosting statis (Netlify/Vercel/Cloudflare) |

## Backend: Menjalankan dan Menguji

```bash
cd backend
npm install
cp .env.example .env            # isi JWT_SECRET
npm run lint                    # pemeriksaan sintaks semua berkas
npm test                        # unit: env, shutdown, health  (tanpa jaringan)
npm run cek-env                 # validasi konfigurasi
npm run dev                     # lokal
node scripts/smoke-produksi.mjs http://localhost:3000 --izinkan-http   # latihan skrip smoke
```

## TODO (urutan pengerjaan)

| Berkas | TODO | Fokus |
| :--- | :---: | :--- |
| `src/lib/env.js` | 13 aturan | `periksaEnv`: aturan umum + khusus produksi |
| `src/lib/shutdown.js` | 1 | `tutupDenganRapi` (hentikan koneksi baru, selesaikan yang berjalan, batas waktu) |
| `src/routes/health.routes.js` | 1 | `/siap`: cek DB dengan timeout, 503 saat shutdown |

`npm test` (≥ 24 pengecekan) harus LULUS.

## Urutan Rilis

1. Lengkapi TODO → `npm test` hijau.
2. Pasang `.github/workflows/*.yml` pada repositori; atur Secrets & Variables.
3. Buat database PostgreSQL terkelola; ubah `provider` Prisma ke `postgresql` dan buat ulang migrasi (lihat catatan).
4. Deploy API dan worker (dua layanan), frontend (hosting statis), atur domain dan HTTPS.
5. Jalankan `smoke-produksi.mjs` terhadap URL publik; simpan keluarannya sebagai bukti.
6. Latih rollback; isi `deploy/runbook.md`.

> **Catatan PostgreSQL.** Migrasi SQLite yang dihasilkan pada pertemuan sebelumnya **tidak** portabel ke PostgreSQL. Untuk produksi: ubah `provider`, hapus folder `prisma/migrations` lama, jalankan `npx prisma migrate dev --name init` pada database PostgreSQL kosong (lokal via Docker Compose), commit migrasi baru, lalu `prisma migrate deploy` pada produksi.

## Uji Docker (opsional)

```bash
cd backend
docker build -t toko-api:1.0.0 .
docker run --rm -p 3000:3000 --env-file .env toko-api:1.0.0
docker compose up --build        # PostgreSQL + API + worker (setelah provider diubah)
```

## Checklist Pengumpulan

- [ ] `npm test` LULUS dan `npm run lint` bersih
- [ ] Workflow CI hijau pada Pull Request (tautan)
- [ ] URL frontend dan URL API publik aktif dengan HTTPS valid
- [ ] Keluaran `smoke-produksi.mjs` (tangkapan layar/teks) terhadap URL publik
- [ ] `deploy/runbook.md` terisi, termasuk latihan rollback
- [ ] Tidak ada rahasia di repositori
- [ ] Commit Conventional dan Pull Request

## Catatan untuk Dosen

`backend/_solusi_dosen/` berisi kunci jawaban (`env.js`, `shutdown.js`, `health.routes.js`). **Jangan dibagikan** sebelum tenggat.

Catatan verifikasi:

- Templat workflow (`ci.yml`, `deploy.yml`) diuji **sintaks YAML**-nya, tetapi belum dijalankan pada GitHub.
- `deploy/nginx.conf` diuji sintaksnya dengan `nginx -t` (tanpa sertifikat).
- `Dockerfile` dan `docker-compose.yml` **belum diuji build-nya** pada lingkungan penyusun (daemon Docker tidak aktif); uji lebih dulu sebelum dibagikan kepada mahasiswa.
- Sesuaikan nama folder dan lokasi `package-lock.json` pada workflow dengan struktur repositori mahasiswa.
