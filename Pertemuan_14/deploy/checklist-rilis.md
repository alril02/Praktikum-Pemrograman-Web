# Daftar Periksa Rilis Produksi

Centang seluruh butir sebelum menyatakan rilis selesai.

## A. Sebelum Rilis
- [ ] Branch `main` hijau pada CI (lint, test, audit)
- [ ] Tidak ada rahasia pada kode/riwayat Git (`git log -p | grep -i secret` atau pemindai rahasia)
- [ ] `.env.example` mutakhir; variabel baru sudah diisi di PaaS
- [ ] `node scripts/cek-env.mjs` (dengan `NODE_ENV=production`) → VALID
- [ ] Migrasi database kompatibel mundur; sudah diuji pada salinan data
- [ ] Backup database terbaru dan pemulihannya pernah diuji
- [ ] Catatan rilis dan rencana rollback ditulis

## B. Infrastruktur
- [ ] DNS (A/CNAME) menunjuk benar; TTL wajar
- [ ] Sertifikat TLS valid ≥ 14 hari, pembaruan otomatis aktif
- [ ] HTTP → HTTPS 301; HSTS aktif
- [ ] CORS hanya mengizinkan origin frontend produksi
- [ ] `TRUST_PROXY` sesuai jumlah proxy
- [ ] Database terkelola (bukan SQLite), akun DB hak minimum
- [ ] Worker berjalan sebagai layanan terpisah

## C. Pasca-Rilis
- [ ] `/api/v1/kesehatan` dan `/api/v1/siap` → 200
- [ ] `node backend/scripts/smoke-produksi.mjs https://api.…` → semua LULUS
- [ ] Alur kritis manual: login → pesan → bayar (sandbox) → status dibayar
- [ ] Webhook gateway diterima (log) dan berstatus `diterapkan`
- [ ] Log tidak memuat rahasia atau data pribadi
- [ ] Alarm uptime aktif; pemilik on-call diketahui

## D. Penutupan
- [ ] Tag rilis (`v1.x.y`) dibuat
- [ ] Runbook diperbarui
- [ ] Retrospeksi singkat bila ada insiden
