// Smoke test end-to-end pertemuan 13.
// Prasyarat: API (:3000), WORKER (npm run worker), dan mock gateway (:4100) berjalan.
//   npm run smoke
// Sarankan .env: JOB_MAX_PERCOBAAN=4, JOB_BACKOFF_MS=300, EMAIL_DELAY_MS=1200, LOGIN_MAX=20

import { tandatangani } from "./src/utils/signature.js";

const API = `${process.env.BASE ?? "http://localhost:3000"}/api/v1`;
const GW = process.env.GATEWAY_BASE_URL ?? "http://localhost:4100";
const SECRET = process.env.GATEWAY_WEBHOOK_SECRET ?? "whsec_praktikum_67890abcdef";
const ADMIN = [process.env.ADMIN_EMAIL ?? "admin@contoh.id", process.env.ADMIN_PASS ?? "AdminRahasia#2026"];
const BUDI = [process.env.BUDI_EMAIL ?? "budi@contoh.id", process.env.BUDI_PASS ?? "BudiRahasia#2026"];
const EMAIL_DELAY = Number(process.env.EMAIL_DELAY_MS) || 1200;

const hasil = [];
let lulus = 0;
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, path, { body, token, base = API, headers = {}, raw } = {}) {
  const h = { Accept: "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const opsi = { method, headers: h };
  if (raw !== undefined) opsi.body = raw;
  else if (body !== undefined) {
    h["Content-Type"] = "application/json";
    opsi.body = JSON.stringify(body);
  }
  const r = await fetch(base + path, opsi);
  const teks = await r.text();
  let json = null;
  try { json = teks ? JSON.parse(teks) : null; } catch { /* bukan JSON */ }
  return { status: r.status, headers: r.headers, json };
}

async function uji(nama, fn) {
  try {
    const ok = Boolean(await fn());
    hasil.push({ nama, ok });
    if (ok) lulus++;
  } catch (e) {
    hasil.push({ nama: `${nama}  [error: ${e.message}]`, ok: false });
  }
}

async function tungguSampai(fn, batasMs = 20000, selang = 250) {
  const mulai = Date.now();
  while (Date.now() - mulai < batasMs) {
    const v = await fn();
    if (v) return v;
    await tunggu(selang);
  }
  return null;
}

const login = async ([email, password]) =>
  (await req("POST", "/auth/masuk", { body: { email, password } })).json?.data?.token;

const tokenAdmin = await login(ADMIN);

// Daftarkan pengguna uji dengan pola email yang memicu perilaku email palsu
async function penggunaBaru(pola) {
  const email = `uji${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}${pola}@contoh.id`;
  const password = "KataSandiUji#2026";
  await req("POST", "/auth/daftar", { body: { nama: "Pengguna Uji", email, password } });
  return { email, token: await login([email, password]) };
}

async function pesanDanBayar(token, produkId = 7) {
  const p = (await req("POST", "/pesanan", { token, body: { item: [{ produkId, jumlah: 1 }] } })).json?.data;
  const b = (await req("POST", `/pesanan/${p.id}/bayar`, { token })).json?.data;
  return { pesanan: p, chargeId: b.chargeId };
}

function eventPaid(pesanan, chargeId, id = `evt_uji_${Math.random().toString(16).slice(2, 10)}`) {
  return JSON.stringify({
    id, type: "charge.paid", created: Math.floor(Date.now() / 1000),
    data: { charge_id: chargeId, order_ref: String(pesanan.id), amount: pesanan.total, status: "paid" },
  });
}

async function kirimWebhook(rawBody) {
  const t0 = performance.now();
  const r = await req("POST", "/webhook/gateway", {
    raw: rawBody,
    headers: { "Content-Type": "application/json", "X-Signature": tandatangani(rawBody, SECRET) },
  });
  return { ...r, ms: performance.now() - t0 };
}

const daftarNotif = async (pesananId) =>
  (await req("GET", `/admin/notifikasi?pesananId=${pesananId}`, { token: tokenAdmin })).json?.data ?? [];
const daftarInvoice = async (pesananId) =>
  (await req("GET", `/admin/invoice?pesananId=${pesananId}`, { token: tokenAdmin })).json?.data ?? [];
const jobDenganKunci = async (kunciUnik) =>
  (await req("GET", `/admin/jobs?kunciUnik=${encodeURIComponent(kunciUnik)}`, { token: tokenAdmin })).json?.data?.[0];

await uji("A0 login admin", async () => Boolean(tokenAdmin));

// ================= A. Antrean =================
const budi = { token: await login(BUDI) };
let a;
await uji("A1 webhook paid dijawab CEPAT walau email lambat (non-blocking)", async () => {
  a = await pesanDanBayar(budi.token, 7);
  const r = await kirimWebhook(eventPaid(a.pesanan, a.chargeId));
  console.log(`   (latensi webhook: ${r.ms.toFixed(0)} ms; email palsu ${EMAIL_DELAY} ms)`);
  return r.status === 200 && r.json?.status === "diterapkan" && r.ms < Math.max(500, EMAIL_DELAY * 0.8);
});

await uji("A2 job outbox tercatat dan Notifikasi + Invoice terbentuk oleh worker", async () => {
  const notif = await tungguSampai(async () => (await daftarNotif(a.pesanan.id)).length === 1 && (await daftarNotif(a.pesanan.id)));
  const inv = await tungguSampai(async () => (await daftarInvoice(a.pesanan.id)).length === 1 && (await daftarInvoice(a.pesanan.id)));
  return Boolean(notif) && Boolean(inv) && /^INV-\d{4}-\d{6}$/.test(inv[0].nomor);
});

await uji("A3 webhook ID berbeda untuk pesanan yang sama -> tidak menggandakan Notifikasi/Invoice", async () => {
  const r = await kirimWebhook(eventPaid(a.pesanan, a.chargeId)); // event id baru; status sudah dibayar -> diabaikan
  await tunggu(EMAIL_DELAY + 800);
  return r.status === 200 && r.json.status === "diabaikan" && (await daftarNotif(a.pesanan.id)).length === 1 && (await daftarInvoice(a.pesanan.id)).length === 1;
});

await uji("A4 enqueue idempoten: hanya satu job per kunciUnik", async () => {
  const e = await req("GET", `/admin/jobs?kunciUnik=email:${a.pesanan.id}`, { token: tokenAdmin });
  const i = await req("GET", `/admin/jobs?kunciUnik=invoice:${a.pesanan.id}`, { token: tokenAdmin });
  return e.json.data.length === 1 && i.json.data.length === 1 && e.json.data[0].status === "selesai";
});

await uji("A5 email gagal 2x lalu berhasil (retry + backoff); job selesai dengan percobaan = 3", async () => {
  const u = await penggunaBaru("+gagal2");
  const { pesanan, chargeId } = await pesanDanBayar(u.token, 8);
  await kirimWebhook(eventPaid(pesanan, chargeId));
  const job = await tungguSampai(async () => {
    const j = await jobDenganKunci(`email:${pesanan.id}`);
    return j?.status === "selesai" ? j : null;
  }, 25000);
  return Boolean(job) && job.percobaan === 3 && (await daftarNotif(pesanan.id)).length === 1;
});

await uji("A6 poison job (+racun) berakhir 'gagal' (DLQ) setelah batas percobaan, tanpa Notifikasi", async () => {
  const u = await penggunaBaru("+racun");
  const { pesanan, chargeId } = await pesanDanBayar(u.token, 9);
  await kirimWebhook(eventPaid(pesanan, chargeId));
  const job = await tungguSampai(async () => {
    const j = await jobDenganKunci(`email:${pesanan.id}`);
    return j?.status === "gagal" ? j : null;
  }, 30000);
  const inv = await tungguSampai(async () => (await daftarInvoice(pesanan.id)).length === 1);
  return Boolean(job) && job.percobaan === job.maksPercobaan && /racun|SMTP/i.test(job.galat ?? "") &&
    (await daftarNotif(pesanan.id)).length === 0 && Boolean(inv); // invoice tetap terbentuk: job independen
});

await uji("A7 endpoint admin: pengguna biasa -> 403", async () =>
  (await req("GET", "/admin/jobs", { token: budi.token })).status === 403);

// ================= B. Performa: cache, ETag, kompresi =================
const URL_LIST = "/produk?batas=100";

await uji("B1 GET /produk: pertama MISS, kedua HIT", async () => {
  await req("POST", "/produk", { token: tokenAdmin, body: { nama: "Pembuang Cache", harga: 1000, stok: 1, kategori: "alat" } })
    .then((r) => r.json?.data?.id && req("DELETE", `/produk/${r.json.data.id}`, { token: tokenAdmin })); // invalidasi
  const a1 = await req("GET", URL_LIST);
  const a2 = await req("GET", URL_LIST);
  return a1.headers.get("x-cache") === "MISS" && a2.headers.get("x-cache") === "HIT";
});

await uji("B2 ETag + permintaan bersyarat -> 304", async () => {
  const r1 = await req("GET", URL_LIST);
  const etag = r1.headers.get("etag");
  // fetch() menambahkan "Cache-Control: no-cache" bila ada If-None-Match manual (aturan spesifikasi Fetch),
  // sehingga server wajib menyajikan ulang. Browser saat "reload" mengirim max-age=0; kita tiru itu.
  const r2 = await req("GET", URL_LIST, { headers: { "If-None-Match": etag, "Cache-Control": "max-age=0" } });
  return Boolean(etag) && r2.status === 304;
});

await uji("B3 Cache-Control publik pada daftar produk", async () =>
  /public/.test((await req("GET", URL_LIST)).headers.get("cache-control") ?? ""));

await uji("B4 penulisan produk membersihkan cache (MISS lagi)", async () => {
  await req("GET", URL_LIST);
  const w = await req("POST", "/produk", { token: tokenAdmin, body: { nama: "Produk Uji Cache", harga: 1000, stok: 1, kategori: "alat" } });
  const setelah = await req("GET", URL_LIST);
  if (w.json?.data?.id) await req("DELETE", `/produk/${w.json.data.id}`, { token: tokenAdmin });
  return w.status === 201 && setelah.headers.get("x-cache") === "MISS" && setelah.json.data.some((p) => p.nama === "Produk Uji Cache");
});

await uji("B5 pesanan baru (stok berubah) membersihkan cache", async () => {
  const sebelum = (await req("GET", URL_LIST)).json.data.find((p) => p.id === 10).stok;
  await req("GET", URL_LIST); // pastikan HIT
  await req("POST", "/pesanan", { token: budi.token, body: { item: [{ produkId: 10, jumlah: 1 }] } });
  const sesudah = await req("GET", URL_LIST);
  return sesudah.headers.get("x-cache") === "MISS" && sesudah.json.data.find((p) => p.id === 10).stok === sebelum - 1;
});

await uji("B6 kompresi gzip aktif untuk respons besar", async () => {
  const r = await fetch(`${API}${URL_LIST}`, { headers: { "Accept-Encoding": "gzip" } });
  await r.arrayBuffer();
  return r.headers.get("content-encoding") === "gzip";
});

await uji("B7 header Server-Timing tersedia", async () =>
  /app;dur=/.test((await req("GET", "/kesehatan")).headers.get("server-timing") ?? ""));

await uji("B8 data per pengguna TIDAK di-cache publik (/pesanan tanpa Cache-Control public)", async () => {
  const r = await req("GET", "/pesanan", { token: budi.token });
  return r.status === 200 && !/public/.test(r.headers.get("cache-control") ?? "") && r.headers.get("x-cache") === null;
});

for (const h of hasil) console.log(`${h.ok ? "LULUS" : "GAGAL"}  ${h.nama}`);
console.log(`\nSkor: ${lulus}/${hasil.length}`);
process.exitCode = lulus === hasil.length ? 0 : 1;
