// Mock Payment Gateway untuk praktikum (TANPA dependensi).
// Meniru perilaku dasar gateway pembayaran: membuat tagihan, halaman bayar, dan webhook bertanda tangan.
//
// Jalankan:  cp .env.example .env && node --env-file=.env server.js     (default :4100)
//
// Endpoint (server-ke-server, butuh  Authorization: Bearer <API_KEY>):
//   POST /v1/charges                 { amount, order_ref }  + header Idempotency-Key
//   GET  /v1/charges/:id
// Simulasi (tanpa auth, hanya untuk praktikum):
//   POST /v1/charges/:id/simulate    { outcome: "paid"|"expired"|"failed", duplicate?, delayMs?, amount?, tamper? }
//          tamper: "bad_signature" | "old_timestamp"
//   GET  /v1/deliveries?charge_id=   log pengiriman webhook (untuk verifikasi)
//   POST /_kontrol                   { gagalBerikutnya: 503, lambatBerikutnyaMs: 6000 }  (memengaruhi POST /v1/charges berikutnya)
// Halaman bayar untuk demo manual di browser:
//   GET  /pay/:id

import http from "node:http";
import { createHmac, randomBytes } from "node:crypto";

const PORT = Number(process.env.PORT) || 4100;
const API_KEY = process.env.API_KEY ?? "sk_test_praktikum_12345";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "whsec_praktikum_67890abcdef";
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/v1/webhook/gateway";
const PAY_BASE = process.env.PAY_BASE ?? `http://localhost:${PORT}`;

/** @type {Map<string, any>} */
const charges = new Map();
/** @type {Map<string, any>} idempotency key -> charge */
const kunciIdempoten = new Map();
const pengiriman = [];
const kontrol = { gagalBerikutnya: null, lambatBerikutnyaMs: 0 };

const acak = (n = 8) => randomBytes(n).toString("hex");
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

function kirimJson(res, status, body, extra = {}) {
  const isi = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(isi), ...extra });
  res.end(isi);
}

async function bacaBody(req) {
  const potongan = [];
  for await (const c of req) potongan.push(c);
  return Buffer.concat(potongan).toString("utf8");
}

function tandatangani(rawBody, t) {
  const v1 = createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${rawBody}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

// Kirim webhook dengan retry (maks 3 percobaan, backoff 400ms * 2^n) bila respons bukan 2xx
async function kirimWebhook(charge, jenis, { amount, tamper } = {}) {
  const event = {
    id: `evt_${acak(6)}`,
    type: jenis,
    created: Math.floor(Date.now() / 1000),
    data: {
      charge_id: charge.id,
      order_ref: charge.order_ref,
      amount: amount ?? charge.amount,
      status: charge.status,
    },
  };
  return kirimEvent(charge.id, event, tamper);
}

async function kirimEvent(chargeId, event, tamper) {
  const raw = JSON.stringify(event);
  let t = Math.floor(Date.now() / 1000);
  if (tamper === "old_timestamp") t -= 3600;
  let header = tandatangani(raw, t);
  if (tamper === "bad_signature") header = `t=${t},v1=${"0".repeat(64)}`;

  for (let percobaan = 1; percobaan <= 3; percobaan++) {
    let status = 0;
    let balasan = null;
    try {
      const r = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Signature": header },
        body: raw,
        signal: AbortSignal.timeout(5000),
      });
      status = r.status;
      balasan = await r.json().catch(() => null);
    } catch (e) {
      status = 0;
      balasan = { galat: e.name };
    }
    pengiriman.push({ chargeId, eventId: event.id, jenis: event.type, percobaan, status, balasan, waktu: new Date().toISOString() });
    if (status >= 200 && status < 300) return;
    if (tamper) return; // peristiwa palsu tidak diulang
    await tunggu(400 * 2 ** (percobaan - 1));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const jalur = url.pathname;
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);

  try {
    // ---------- kontrol simulasi ----------
    if (req.method === "POST" && jalur === "/_kontrol") {
      const b = JSON.parse((await bacaBody(req)) || "{}");
      kontrol.gagalBerikutnya = Number(b.gagalBerikutnya) || null;
      kontrol.lambatBerikutnyaMs = Number(b.lambatBerikutnyaMs) || 0;
      return kirimJson(res, 200, { kontrol });
    }

    // ---------- API server-ke-server ----------
    if (req.method === "POST" && jalur === "/v1/charges") {
      if (req.headers.authorization !== `Bearer ${API_KEY}`) {
        return kirimJson(res, 401, { error: { kode: "api_key_salah" } });
      }
      if (kontrol.lambatBerikutnyaMs) {
        const ms = kontrol.lambatBerikutnyaMs;
        kontrol.lambatBerikutnyaMs = 0;
        await tunggu(ms);
      }
      if (kontrol.gagalBerikutnya) {
        const kode = kontrol.gagalBerikutnya;
        kontrol.gagalBerikutnya = null;
        return kirimJson(res, kode, { error: { kode: "gagal_simulasi" } });
      }

      const b = JSON.parse((await bacaBody(req)) || "{}");
      if (!Number.isInteger(b.amount) || b.amount <= 0 || typeof b.order_ref !== "string") {
        return kirimJson(res, 400, { error: { kode: "parameter_tidak_valid" } });
      }

      const kunci = req.headers["idempotency-key"];
      if (kunci && kunciIdempoten.has(kunci)) {
        return kirimJson(res, 200, kunciIdempoten.get(kunci), { "Idempotent-Replay": "true" });
      }

      const id = `ch_${acak(6)}`;
      const charge = {
        id,
        amount: b.amount,
        order_ref: b.order_ref,
        status: "pending",
        payment_url: `${PAY_BASE}/pay/${id}`,
        created: Math.floor(Date.now() / 1000),
      };
      charges.set(id, charge);
      if (kunci) kunciIdempoten.set(kunci, charge);
      return kirimJson(res, 201, charge);
    }

    const mCharge = jalur.match(/^\/v1\/charges\/(ch_[a-f0-9]+)$/);
    if (req.method === "GET" && mCharge) {
      if (req.headers.authorization !== `Bearer ${API_KEY}`) {
        return kirimJson(res, 401, { error: { kode: "api_key_salah" } });
      }
      const c = charges.get(mCharge[1]);
      return c ? kirimJson(res, 200, c) : kirimJson(res, 404, { error: { kode: "tidak_ditemukan" } });
    }

    // ---------- simulasi pembayaran ----------
    const mSim = jalur.match(/^\/v1\/charges\/(ch_[a-f0-9]+)\/simulate$/);
    if (req.method === "POST" && mSim) {
      const c = charges.get(mSim[1]);
      if (!c) return kirimJson(res, 404, { error: { kode: "tidak_ditemukan" } });

      const b = JSON.parse((await bacaBody(req)) || "{}");
      const peta = { paid: "charge.paid", expired: "charge.expired", failed: "charge.failed" };
      const jenis = peta[b.outcome];
      if (!jenis) return kirimJson(res, 400, { error: { kode: "outcome_tidak_dikenal" } });

      c.status = b.outcome;
      const kirim = async () => {
        if (b.delayMs) await tunggu(Number(b.delayMs));
        const opsi = { amount: b.amount, tamper: b.tamper };
        await kirimWebhook(c, jenis, opsi);
        if (b.duplicate) await kirimWebhook(c, jenis, opsi); // ID peristiwa berbeda utk simulasi sederhana
      };

      if (b.duplicateSameId) {
        // Kirim PERSIS peristiwa yang sama dua kali (ID sama) untuk menguji dedupe
        const event = {
          id: `evt_${acak(6)}`, type: jenis, created: Math.floor(Date.now() / 1000),
          data: { charge_id: c.id, order_ref: c.order_ref, amount: b.amount ?? c.amount, status: c.status },
        };
        await kirimEvent(c.id, event, b.tamper);
        await kirimEvent(c.id, event, b.tamper);
      } else {
        await kirim();
      }
      return kirimJson(res, 200, { charge: c });
    }

    if (req.method === "GET" && jalur === "/v1/deliveries") {
      const id = url.searchParams.get("charge_id");
      return kirimJson(res, 200, { data: pengiriman.filter((p) => !id || p.chargeId === id) });
    }

    // ---------- halaman bayar (demo manual) ----------
    const mPay = jalur.match(/^\/pay\/(ch_[a-f0-9]+)$/);
    if (req.method === "GET" && mPay) {
      const c = charges.get(mPay[1]);
      if (!c) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Tagihan tidak ditemukan"); }
      const html = `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mock Gateway — Bayar</title>
<body style="font-family:system-ui;max-width:28rem;margin:3rem auto;padding:0 1rem">
<h1>Mock Gateway</h1>
<p>Tagihan <strong>${c.id}</strong> untuk pesanan <strong>#${c.order_ref}</strong></p>
<p>Jumlah: <strong>Rp ${c.amount.toLocaleString("id-ID")}</strong> — status: <strong id="s">${c.status}</strong></p>
<button onclick="aksi('paid')">Bayar</button> <button onclick="aksi('expired')">Kedaluwarsakan</button> <button onclick="aksi('failed')">Gagalkan</button>
<script>
async function aksi(o){const r=await fetch('/v1/charges/${c.id}/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({outcome:o})});
const j=await r.json();document.getElementById('s').textContent=j.charge?.status??'galat';}
</script></body></html>`;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "X-Content-Type-Options": "nosniff" });
      return res.end(html);
    }

    kirimJson(res, 404, { error: { kode: "rute_tidak_ditemukan" } });
  } catch (e) {
    console.error(e);
    kirimJson(res, 500, { error: { kode: "galat_server" } });
  }
});

server.listen(PORT, () => {
  console.log(`Mock gateway aktif di http://localhost:${PORT}`);
  console.log(`  webhook -> ${WEBHOOK_URL}`);
});
