// Smoke test end-to-end pertemuan 12.
// Prasyarat: backend (:3000) DAN mock gateway (:4100) berjalan, rahasia sama pada keduanya.
//   npm run smoke
// Mulai dari data bersih bila perlu:  npm run db:reset

import { tandatangani } from "./src/utils/signature.js";

const API = `${process.env.BASE ?? "http://localhost:3000"}/api/v1`;
const GW = process.env.GATEWAY_BASE_URL ?? "http://localhost:4100";
const SECRET = process.env.GATEWAY_WEBHOOK_SECRET ?? "whsec_praktikum_67890abcdef";
const BUDI = [process.env.BUDI_EMAIL ?? "budi@contoh.id", process.env.BUDI_PASS ?? "BudiRahasia#2026"];
const SARI = [process.env.SARI_EMAIL ?? "sari@contoh.id", process.env.SARI_PASS ?? "SariRahasia#2026"];

const hasil = [];
let lulus = 0;

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

async function req(method, path, { body, token, base = API, headers = {}, raw } = {}) {
  const h = { Accept: "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const opsi = { method, headers: h };
  if (raw !== undefined) {
    opsi.body = raw;
  } else if (body !== undefined) {
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

async function tungguStatus(token, id, status, batasMs = 4000) {
  const mulai = Date.now();
  while (Date.now() - mulai < batasMs) {
    const r = await req("GET", `/pesanan/${id}`, { token });
    if (r.json?.data?.status === status) return true;
    await tunggu(150);
  }
  return false;
}

async function login([email, password]) {
  const r = await req("POST", "/auth/masuk", { body: { email, password } });
  return r.json?.data?.token;
}

const buat = async (token, produkId = 7, jumlah = 1) => {
  const r = await req("POST", "/pesanan", { token, body: { item: [{ produkId, jumlah }] } });
  return r.json?.data;
};
const stok = async (id) => (await req("GET", `/produk/${id}`)).json?.data?.stok;
const simulasi = (chargeId, b) => req("POST", `/v1/charges/${chargeId}/simulate`, { base: GW, body: b });

// Kirim webhook buatan sendiri ke backend (menandatangani dengan rahasia yang benar)
function kirimEvent(event, { t, header } = {}) {
  const raw = JSON.stringify(event);
  return req("POST", "/webhook/gateway", {
    raw,
    headers: { "Content-Type": "application/json", "X-Signature": header ?? tandatangani(raw, SECRET, t) },
  });
}
const idEvt = () => `evt_uji_${Math.random().toString(16).slice(2, 10)}`;

const tokenBudi = await login(BUDI);
const tokenSari = await login(SARI);

// ================= A. Membuat tagihan =================
let p1;
let bayar1;
await uji("A0 login budi dan sari", async () => Boolean(tokenBudi && tokenSari));

await uji("A1 pesanan baru -> /bayar menghasilkan chargeId & paymentUrl", async () => {
  p1 = await buat(tokenBudi);
  const r = await req("POST", `/pesanan/${p1.id}/bayar`, { token: tokenBudi });
  bayar1 = r.json?.data;
  return r.status === 200 && /^ch_[a-f0-9]+$/.test(bayar1?.chargeId ?? "") && /\/pay\/ch_/.test(bayar1?.paymentUrl ?? "");
});

await uji("A2 /bayar idempoten: chargeId sama pada panggilan kedua", async () => {
  const r = await req("POST", `/pesanan/${p1.id}/bayar`, { token: tokenBudi });
  return r.status === 200 && r.json.data.chargeId === bayar1.chargeId;
});

await uji("A3 pesanan masih menunggu_pembayaran sebelum webhook", async () =>
  (await req("GET", `/pesanan/${p1.id}`, { token: tokenBudi })).json.data.status === "menunggu_pembayaran");

await uji("A4 pengguna lain tidak dapat membayar pesanan ini -> 404", async () =>
  (await req("POST", `/pesanan/${p1.id}/bayar`, { token: tokenSari })).status === 404);

await uji("A5 tanpa token -> 401", async () => (await req("POST", `/pesanan/${p1.id}/bayar`)).status === 401);

// ================= B. Webhook valid =================
await uji("B1 gateway mengirim paid (ID sama dua kali) -> status dibayar, pengiriman kedua 'duplikat'", async () => {
  await simulasi(bayar1.chargeId, { outcome: "paid", duplicateSameId: true });
  const ok = await tungguStatus(tokenBudi, p1.id, "dibayar");
  const log = (await req("GET", `/v1/deliveries?charge_id=${bayar1.chargeId}`, { base: GW })).json.data;
  const statuses = log.map((l) => l.balasan?.status);
  return ok && log.length >= 2 && log.every((l) => l.status === 200) && statuses.includes("duplikat");
});

await uji("B2 /bayar untuk pesanan yang sudah dibayar -> 409", async () =>
  (await req("POST", `/pesanan/${p1.id}/bayar`, { token: tokenBudi })).status === 409);

await uji("B3 dibayarPada terisi dan pembayaran tercatat", async () => {
  const d = (await req("GET", `/pesanan/${p1.id}`, { token: tokenBudi })).json.data;
  return Boolean(d.dibayarPada) && d.pembayaran?.chargeId === bayar1.chargeId;
});

// ================= C. Keamanan webhook =================
let p2;
let bayar2;
await uji("C0 siapkan pesanan kedua", async () => {
  p2 = await buat(tokenBudi, 8, 1);
  bayar2 = (await req("POST", `/pesanan/${p2.id}/bayar`, { token: tokenBudi })).json.data;
  return Boolean(bayar2?.chargeId);
});

const eventPaidP2 = (id = idEvt(), amount = p2?.total) => ({
  id,
  type: "charge.paid",
  created: Math.floor(Date.now() / 1000),
  data: { charge_id: bayar2?.chargeId, order_ref: String(p2?.id), amount, status: "paid" },
});

await uji("C1 tanpa X-Signature -> 401, status tidak berubah", async () => {
  const r = await req("POST", "/webhook/gateway", {
    raw: JSON.stringify(eventPaidP2()),
    headers: { "Content-Type": "application/json" },
  });
  const s = (await req("GET", `/pesanan/${p2.id}`, { token: tokenBudi })).json.data.status;
  return r.status === 401 && s === "menunggu_pembayaran";
});

await uji("C2 tanda tangan salah (rahasia lain) -> 401", async () => {
  const raw = JSON.stringify(eventPaidP2());
  const r = await req("POST", "/webhook/gateway", {
    raw,
    headers: { "Content-Type": "application/json", "X-Signature": tandatangani(raw, "rahasia-penyerang-yang-salah-123") },
  });
  return r.status === 401;
});

await uji("C3 body diubah setelah ditandatangani -> 401", async () => {
  const asli = JSON.stringify(eventPaidP2());
  const header = tandatangani(asli, SECRET);
  const diubah = asli.replace(String(p2.id), "1");
  const r = await req("POST", "/webhook/gateway", {
    raw: diubah,
    headers: { "Content-Type": "application/json", "X-Signature": header },
  });
  return r.status === 401;
});

await uji("C4 replay: timestamp 1 jam lalu (tanda tangan sah) -> 401", async () => {
  const r = await kirimEvent(eventPaidP2(), { t: Math.floor(Date.now() / 1000) - 3600 });
  return r.status === 401;
});

await uji("C5 jumlah tidak cocok -> 200 diabaikan, status tetap menunggu", async () => {
  const r = await kirimEvent(eventPaidP2(idEvt(), 1));
  const s = (await req("GET", `/pesanan/${p2.id}`, { token: tokenBudi })).json.data.status;
  return r.status === 200 && r.json.status === "jumlah_tidak_cocok" && s === "menunggu_pembayaran";
});

await uji("C6 pesanan tidak dikenal -> 200 'pesanan_tidak_ada' (tanpa retry tak berujung)", async () => {
  const r = await kirimEvent({
    id: idEvt(), type: "charge.paid", created: 0,
    data: { charge_id: "ch_tidakada", order_ref: "99999999", amount: 1000, status: "paid" },
  });
  return r.status === 200 && r.json.status === "pesanan_tidak_ada";
});

await uji("C7 JSON rusak (bertanda tangan sah) -> 400; bentuk salah -> 400", async () => {
  const rusak = "{bukan json";
  const a = await req("POST", "/webhook/gateway", {
    raw: rusak,
    headers: { "Content-Type": "application/json", "X-Signature": tandatangani(rusak, SECRET) },
  });
  const salah = JSON.stringify({ id: 1, type: [] });
  const b = await req("POST", "/webhook/gateway", {
    raw: salah,
    headers: { "Content-Type": "application/json", "X-Signature": tandatangani(salah, SECRET) },
  });
  return a.status === 400 && b.status === 400;
});

await uji("C8 peristiwa valid sungguhan akhirnya diterima -> dibayar", async () => {
  const r = await kirimEvent(eventPaidP2());
  const ok = await tungguStatus(tokenBudi, p2.id, "dibayar");
  return r.status === 200 && r.json.status === "diterapkan" && ok;
});

// ================= D. Kedaluwarsa, stok, dan urutan =================
let p3;
let bayar3;
let stokAwal;
await uji("D1 pesanan baru mengurangi stok", async () => {
  stokAwal = await stok(9);
  p3 = await buat(tokenBudi, 9, 1);
  bayar3 = (await req("POST", `/pesanan/${p3.id}/bayar`, { token: tokenBudi })).json.data;
  return (await stok(9)) === stokAwal - 1;
});

await uji("D2 expired -> kedaluwarsa dan stok dikembalikan (sekali)", async () => {
  await simulasi(bayar3.chargeId, { outcome: "expired", duplicateSameId: true });
  const ok = await tungguStatus(tokenBudi, p3.id, "kedaluwarsa");
  return ok && (await stok(9)) === stokAwal;
});

await uji("D3 paid setelah kedaluwarsa -> status TETAP, ditandai rekonsiliasi", async () => {
  const r = await kirimEvent({
    id: idEvt(), type: "charge.paid", created: Math.floor(Date.now() / 1000),
    data: { charge_id: bayar3.chargeId, order_ref: String(p3.id), amount: p3.total, status: "paid" },
  });
  const d = (await req("GET", `/pesanan/${p3.id}`, { token: tokenBudi })).json.data;
  return r.status === 200 && r.json.status === "rekonsiliasi" && d.status === "kedaluwarsa" && Boolean(d.catatan);
});

await uji("D4 /bayar pada pesanan kedaluwarsa -> 409", async () =>
  (await req("POST", `/pesanan/${p3.id}/bayar`, { token: tokenBudi })).status === 409);

// ================= E. Ketahanan terhadap gateway bermasalah =================
await uji("E1 gateway 503 -> /bayar 502; setelah pulih -> 200 (idempoten)", async () => {
  const p = await buat(tokenBudi, 10, 1);
  await req("POST", "/_kontrol", { base: GW, body: { gagalBerikutnya: 503 } });
  const gagal = await req("POST", `/pesanan/${p.id}/bayar`, { token: tokenBudi });
  const pulih = await req("POST", `/pesanan/${p.id}/bayar`, { token: tokenBudi });
  return gagal.status === 502 && gagal.json?.error?.kode === "GATEWAY_ERROR" && pulih.status === 200;
});

await uji("E2 gateway lambat (> timeout) -> 504 GATEWAY_TIMEOUT", async () => {
  const p = await buat(tokenBudi, 5, 1);
  await req("POST", "/_kontrol", { base: GW, body: { lambatBerikutnyaMs: 8000 } });
  const r = await req("POST", `/pesanan/${p.id}/bayar`, { token: tokenBudi });
  return r.status === 504 && r.json?.error?.kode === "GATEWAY_TIMEOUT";
});

for (const h of hasil) console.log(`${h.ok ? "LULUS" : "GAGAL"}  ${h.nama}`);
console.log(`\nSkor: ${lulus}/${hasil.length}`);
process.exitCode = lulus === hasil.length ? 0 : 1;
