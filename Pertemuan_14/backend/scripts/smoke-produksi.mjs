// Smoke test pasca-deploy terhadap URL publik.
//   node scripts/smoke-produksi.mjs https://api.contoh.id
//   node scripts/smoke-produksi.mjs http://localhost:3000 --izinkan-http      (uji lokal)
//   node scripts/smoke-produksi.mjs https://api.contoh.id --origin-frontend=https://toko.contoh.id
//
// Pemeriksaan: HTTPS & sertifikat, redirect HTTP->HTTPS, HSTS, health/readiness,
// header keamanan, CORS origin asing, tidak membocorkan stack trace.

import tls from "node:tls";

const argumen = process.argv.slice(2);
const base = (argumen.find((a) => /^https?:\/\//.test(a)) ?? "").replace(/\/$/, "");
const izinkanHttp = argumen.includes("--izinkan-http");
const originFrontend = argumen.find((a) => a.startsWith("--origin-frontend="))?.split("=")[1];

if (!base) {
  console.error("Pemakaian: node scripts/smoke-produksi.mjs <url-dasar-api> [--izinkan-http] [--origin-frontend=URL]");
  process.exit(2);
}

const url = new URL(base);
const adalahHttps = url.protocol === "https:";
const hasil = [];
let lulus = 0;

async function uji(nama, fn, { lewati = false } = {}) {
  if (lewati) {
    hasil.push({ nama, status: "LEWATI" });
    return;
  }
  try {
    const r = await fn();
    const ok = r === true || r?.ok === true;
    hasil.push({ nama, status: ok ? "LULUS" : "GAGAL", info: r?.info });
    if (ok) lulus++;
  } catch (e) {
    hasil.push({ nama, status: "GAGAL", info: e.message });
  }
}

const ambil = (path, opsi = {}) => fetch(base + path, { redirect: "manual", ...opsi });

await uji("Menggunakan HTTPS", () => ({ ok: adalahHttps || izinkanHttp, info: adalahHttps ? "" : "HTTP (hanya diizinkan untuk uji lokal)" }));

await uji(
  "Sertifikat TLS valid dan berlaku >= 14 hari",
  () =>
    new Promise((resolve, reject) => {
      const s = tls.connect({ host: url.hostname, port: Number(url.port) || 443, servername: url.hostname }, () => {
        const c = s.getPeerCertificate();
        const sisaHari = Math.floor((new Date(c.valid_to) - Date.now()) / 86_400_000);
        const ok = s.authorized && sisaHari >= 14;
        s.end();
        resolve({ ok, info: `${s.authorized ? "tepercaya" : s.authorizationError}; sisa ${sisaHari} hari` });
      });
      s.setTimeout(8000, () => {
        s.destroy();
        reject(new Error("timeout TLS"));
      });
      s.on("error", reject);
    }),
  { lewati: !adalahHttps }
);

await uji(
  "HTTP dialihkan ke HTTPS (301/308)",
  async () => {
    const r = await fetch(`http://${url.host}/`, { redirect: "manual" });
    const loc = r.headers.get("location") ?? "";
    return { ok: [301, 308].includes(r.status) && loc.startsWith("https://"), info: `${r.status} ${loc}` };
  },
  { lewati: !adalahHttps }
);

await uji("HSTS aktif (Strict-Transport-Security)", async () => {
  const r = await ambil("/api/v1/kesehatan");
  const h = r.headers.get("strict-transport-security") ?? "";
  return { ok: /max-age=\d{6,}/.test(h), info: h || "header tidak ada" };
}, { lewati: !adalahHttps });

await uji("GET /api/v1/kesehatan -> 200", async () => {
  const r = await ambil("/api/v1/kesehatan");
  const j = await r.json().catch(() => ({}));
  return { ok: r.status === 200 && j.status === "ok", info: `versi ${j.versi ?? "?"}` };
});

await uji("GET /api/v1/siap -> 200 (database siap)", async () => {
  const r = await ambil("/api/v1/siap");
  return { ok: r.status === 200, info: `status ${r.status}` };
});

await uji("Tanpa header X-Powered-By", async () => {
  const r = await ambil("/api/v1/kesehatan");
  return !r.headers.get("x-powered-by");
});

await uji("X-Content-Type-Options: nosniff", async () => {
  const r = await ambil("/api/v1/kesehatan");
  return r.headers.get("x-content-type-options") === "nosniff";
});

await uji("CORS: origin asing TIDAK diizinkan", async () => {
  const r = await ambil("/api/v1/produk", { headers: { Origin: "https://situs-jahat.example" } });
  const aco = r.headers.get("access-control-allow-origin");
  return { ok: !aco || aco === "null" ? true : false, info: aco ?? "tidak ada header" };
});

await uji(
  "CORS: origin frontend diizinkan",
  async () => {
    const r = await ambil("/api/v1/produk", { headers: { Origin: originFrontend } });
    return { ok: r.headers.get("access-control-allow-origin") === originFrontend, info: r.headers.get("access-control-allow-origin") ?? "tidak ada" };
  },
  { lewati: !originFrontend }
);

await uji("Rute tak dikenal -> 404 JSON tanpa stack trace", async () => {
  const r = await ambil("/api/v1/tidak-ada-" + Date.now());
  const teks = await r.text();
  const bocor = /node_modules|\bat\s+\w+.*\(.*:\d+:\d+\)|\.js:\d+/.test(teks);
  return { ok: r.status === 404 && !bocor, info: bocor ? "stack trace terdeteksi!" : "" };
});

await uji("Daftar produk dapat dibaca (200) dengan kompresi tersedia", async () => {
  const r = await ambil("/api/v1/produk?batas=100", { headers: { "Accept-Encoding": "gzip" } });
  await r.arrayBuffer();
  return { ok: r.status === 200, info: `content-encoding: ${r.headers.get("content-encoding") ?? "-"}` };
});

console.log(`Target: ${base}\n`);
for (const h of hasil) console.log(`${h.status.padEnd(6)} ${h.nama}${h.info ? `  — ${h.info}` : ""}`);
const dihitung = hasil.filter((h) => h.status !== "LEWATI").length;
console.log(`\nSkor: ${lulus}/${dihitung}${hasil.some((h) => h.status === "LEWATI") ? " (sebagian dilewati)" : ""}`);
process.exitCode = lulus === dihitung ? 0 : 1;
