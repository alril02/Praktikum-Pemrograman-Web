# Tes Frontend (Vitest + Vue Test Utils)

Dipasang pada proyek frontend pertemuan 9/11.

## Pemasangan

```bash
cd frontend
npm install -D vitest @vue/test-utils happy-dom
mkdir tests-unit
cp ../Praktikum/Pertemuan_15/frontend-tests/vitest.config.mjs .
cp ../Praktikum/Pertemuan_15/frontend-tests/tests/*.test.js tests-unit/
```

Tambahkan pada `package.json` bagian `scripts`:

```json
"test:unit": "vitest run"
```

> Tes lain yang sudah ada (`tests/*.test.mjs` memakai `node --test`) tetap berjalan lewat `npm test`. Berkas Vitest berada di folder terpisah `tests-unit/` agar tidak bentrok.

## Isi

| Berkas | Status | Fokus |
| :--- | :--- | :--- |
| `ProductCard.test.js` | Contoh lengkap | Render, event `emit`, tombol nonaktif, keamanan HTML pada nama produk |
| `LoginView.test.js` | **TUGAS** (5 `it.todo`) | 401 generik, validasi kosong, `next` internal vs eksternal, cegah kirim ganda |
| `_solusi_dosen/LoginView.test.js` | Kunci jawaban | Jangan dibagikan sebelum tenggat |

## Prinsip

- Uji perilaku yang dilihat pengguna: teks, atribut (`disabled`, ARIA), event, dan navigasi.
- Ganti hanya batas sistem: `fetch` (jaringan). Router dan Pinia memakai instance sungguhan (in-memory).
- Setiap tes menyiapkan keadaan sendiri dan membersihkan stub global (`vi.unstubAllGlobals`).
