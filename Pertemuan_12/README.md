# Praktikum Pertemuan 12 — Integrasi Layanan Pihak Ketiga & Webhook

Panduan lengkap: `Materi/Materi_12_Integrasi_Layanan_Pihak_Ketiga_dan_Webhook.md` (bagian 5).

| Folder | Isi |
| :--- | :--- |
| `mock-gateway/` | Gateway pembayaran tiruan **tanpa dependensi** (dosen): charge, halaman bayar, webhook bertanda tangan, simulasi kegagalan |
| `backend/` | Backend pertemuan 11 + pembayaran + webhook (mahasiswa) |

## Menjalankan

```bash
# Terminal 1 - mock gateway (:4100)
cd mock-gateway
cp .env.example .env              # Windows: copy .env.example .env
node --env-file=.env server.js

# Terminal 2 - backend (:3000)
cd backend
npm install
cp .env.example .env              # isi JWT_SECRET; GATEWAY_* harus cocok dengan mock-gateway/.env
npx prisma migrate dev --name tambah-pembayaran
npm run db:seed
npm test                          # unit test: signature + state machine
npm run dev

# Terminal 3
cd backend && npm run smoke
```

## TODO (urutan pengerjaan)

| Berkas | TODO | Fokus |
| :--- | :---: | :--- |
| `src/utils/signature.js` | 1 | Verifikasi HMAC + umur timestamp + timingSafeEqual |
| `src/domain/pesanan.status.js` | 3 | `bolehTransisi`, `statusDariEvent`, `putuskanTransisi` |
| `src/services/gateway.client.js` | 1 | API key, timeout, idempotency key, pemetaan 502/504 |
| `src/controllers/pembayaran.controller.js` | 1 (7 langkah) | `/pesanan/:id/bayar` idempoten + kepemilikan |
| `src/services/pembayaran.service.js` | 1 (5 langkah) | Transaksi: dedupe, validasi, state machine, stok |
| `src/controllers/webhook.controller.js` | 1 (6 langkah) | Raw body, verifikasi, balas cepat |

`npm test` harus LULUS (unit) sebelum menjalankan smoke test end-to-end.

## Demo Manual di Browser

1. Login sebagai `budi@contoh.id` dan buat pesanan (`requests.http`).
2. `POST /api/v1/pesanan/:id/bayar` → buka `paymentUrl` di browser.
3. Klik **Bayar**; amati log backend (`[webhook] evt_... charge.paid -> diterapkan`) dan status pesanan.

## Kontrak Webhook (dokumentasikan pada README repositori Anda)

| Item | Nilai |
| :--- | :--- |
| Endpoint | `POST /api/v1/webhook/gateway` |
| Header | `X-Signature: t=<unix>,v1=<hex HMAC-SHA256 dari "<t>.<body mentah>">` |
| Peristiwa | `charge.paid`, `charge.expired`, `charge.failed` |
| Toleransi waktu | 300 detik |
| Balasan | 200 `{status}`; 401 tanda tangan tidak valid; 400 bentuk salah; 409 konflik (penyedia mencoba lagi) |

## Checklist Pengumpulan

- [ ] `npm test` seluruhnya LULUS (18 pengecekan)
- [ ] `npm run smoke` seluruhnya LULUS (24 pengecekan)
- [ ] Tidak ada rahasia gateway di repositori; `.env.example` tanpa nilai nyata
- [ ] Kontrak webhook terdokumentasi di README
- [ ] Commit Conventional dan Pull Request

## Pengayaan (opsional)

Daftarkan akun sandbox gateway sungguhan (Midtrans/Xendit), gunakan tunnel untuk menerima webhook, dan bandingkan format tanda tangan mereka dengan mock.

## Catatan untuk Dosen

`backend/_solusi_dosen/` berisi kunci jawaban (`signature.js`, `pesanan.status.js`, `gateway.client.js`, `pembayaran.service.js`, `pembayaran.controller.js`, `webhook.controller.js`). **Jangan dibagikan** sebelum tenggat.

Mock gateway menggunakan retry bawaan (3 percobaan, backoff 400 ms × 2ⁿ) sehingga perilaku "at-least-once" dapat diamati pada `GET /v1/deliveries?charge_id=`.
