// Smoke test keamanan pertemuan 10.
// Jalankan setelah server aktif:   npm run smoke
// CATATAN: ada uji pembatas laju (429). Tunggu ~1 menit atau restart server sebelum menjalankan ulang.
//
// Kredensial seed (lihat prisma/seed.js). Dapat dioverride lewat env:
//   ADMIN_EMAIL, ADMIN_PASS, BUDI_EMAIL, BUDI_PASS, SARI_EMAIL, SARI_PASS

import { createHmac } from "node:crypto";

const BASE = process.env.BASE ?? "http://localhost:3000";
const API = `${BASE}/api/v1`;

const KRED = {
  admin: [process.env.ADMIN_EMAIL ?? "admin@contoh.id", process.env.ADMIN_PASS ?? "AdminRahasia#2026"],
  budi: [process.env.BUDI_EMAIL ?? "budi@contoh.id", process.env.BUDI_PASS ?? "BudiRahasia#2026"],
  sari: [process.env.SARI_EMAIL ?? "sari@contoh.id", process.env.SARI_PASS ?? "SariRahasia#2026"],
};

const hasil = [];
let lulus = 0;

async function req(method, path, { body, token, headers = {} } = {}) {
  const h = { Accept: "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const opsi = { method, headers: h };
  if (body !== undefined) {
    h["Content-Type"] = "application/json";
    opsi.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const r = await fetch(API + path, opsi);
  const teks = await r.text();
  let json = null;
  try { json = teks ? JSON.parse(teks) : null; } catch { /* bukan JSON */ }
  return { status: r.status, headers: r.headers, json, teks };
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

const b64url = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const sekarang = () => Math.floor(Date.now() / 1000);

// ---------- Persiapan: login tiga akun ----------
async function masuk([email, password]) {
  const r = await req("POST", "/auth/masuk", { body: { email, password } });
  return { token: r.json?.data?.token, pengguna: r.json?.data?.pengguna, status: r.status, r };
}
const admin = await masuk(KRED.admin);
const budi = await masuk(KRED.budi);
const sari = await masuk(KRED.sari);

// ================= A. Autentikasi =================
await uji("A1 login benar -> 200 + token JWT (3 bagian) + peran", async () =>
  admin.status === 200 && admin.token?.split(".").length === 3 && admin.pengguna?.peran === "admin" && budi.pengguna?.peran === "user");

await uji("A2 respons login/saya tidak membocorkan passwordHash", async () => {
  const r = await req("GET", "/auth/saya", { token: budi.token });
  return r.status === 200 && r.json.data.email === KRED.budi[0] && !("passwordHash" in r.json.data) && !JSON.stringify(admin.r.json).includes("passwordHash");
});

await uji("A3 kredensial salah: email tak ada vs sandi salah -> respons IDENTIK", async () => {
  const a = await req("POST", "/auth/masuk", { body: { email: "tidak.ada@contoh.id", password: "SembarangSandi123!" } });
  const b = await req("POST", "/auth/masuk", { body: { email: KRED.budi[0], password: "SandiSalahSekali!!" } });
  return a.status === 401 && b.status === 401 &&
    a.json?.error?.kode === b.json?.error?.kode && a.json?.error?.pesan === b.json?.error?.pesan;
});

const emailBaru = `uji.${Date.now()}@contoh.id`;
await uji("A4 daftar valid -> 201, peran 'user', tanpa hash (peran dari klien diabaikan)", async () => {
  const r = await req("POST", "/auth/daftar", {
    body: { nama: "Penguji Baru", email: emailBaru, password: "KataSandiPanjang#1", peran: "admin" },
  });
  return r.status === 201 && r.json.data.peran === "user" && !("passwordHash" in r.json.data) && !JSON.stringify(r.json).includes("$2");
});
await uji("A5 daftar email duplikat -> 409", async () =>
  (await req("POST", "/auth/daftar", { body: { nama: "Dobel", email: emailBaru, password: "KataSandiPanjang#1" } })).status === 409);
await uji("A6 daftar sandi pendek -> 422 (detail field password)", async () => {
  const r = await req("POST", "/auth/daftar", { body: { nama: "Pendek", email: `p.${Date.now()}@contoh.id`, password: "pendek" } });
  return r.status === 422 && r.json.error.detail.some((d) => d.field === "password");
});
await uji("A7 akun baru dapat login", async () =>
  (await req("POST", "/auth/masuk", { body: { email: emailBaru, password: "KataSandiPanjang#1" } })).status === 200);

// ================= B. Token =================
await uji("B1 tanpa token -> 401 + WWW-Authenticate", async () => {
  const r = await req("GET", "/pesanan");
  return r.status === 401 && (r.headers.get("www-authenticate") ?? "").startsWith("Bearer");
});
await uji("B2 token diubah satu karakter -> 401", async () => {
  const t = budi.token;
  const rusak = t.slice(0, -2) + (t.slice(-2, -1) === "A" ? "B" : "A") + t.slice(-1);
  return (await req("GET", "/pesanan", { token: rusak })).status === 401;
});
await uji("B3 token alg=none (tanpa tanda tangan) -> 401", async () => {
  const jahat = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({
    sub: String(admin.pengguna.id), peran: "admin", iss: "toko-api", aud: "toko-web", exp: sekarang() + 600,
  })}.`;
  return (await req("POST", "/produk", { token: jahat, body: { nama: "Produk Jahat", harga: 1, stok: 1, kategori: "kopi" } })).status === 401;
});
await uji("B4 token ditandatangani rahasia lain -> 401", async () => {
  const head = b64url({ alg: "HS256", typ: "JWT" });
  const pay = b64url({ sub: String(admin.pengguna.id), peran: "admin", iss: "toko-api", aud: "toko-web", exp: sekarang() + 600 });
  const sig = createHmac("sha256", "rahasia-palsu-penyerang").update(`${head}.${pay}`).digest("base64url");
  return (await req("GET", "/auth/saya", { token: `${head}.${pay}.${sig}` })).status === 401;
});
await uji("B5 skema bukan Bearer -> 401", async () =>
  (await req("GET", "/auth/saya", { headers: { Authorization: `Basic ${Buffer.from("a:b").toString("base64")}` } })).status === 401);

// ================= C. RBAC =================
const produkBaru = { nama: "Kopi Uji Keamanan", harga: 50000, stok: 5, kategori: "kopi" };
await uji("C1 GET /produk publik -> 200", async () => (await req("GET", "/produk")).status === 200);
await uji("C2 POST /produk tanpa token -> 401", async () => (await req("POST", "/produk", { body: produkBaru })).status === 401);
await uji("C3 POST /produk peran user -> 403", async () => (await req("POST", "/produk", { token: budi.token, body: produkBaru })).status === 403);
let idProduk;
await uji("C4 POST /produk admin -> 201", async () => {
  const r = await req("POST", "/produk", { token: admin.token, body: produkBaru });
  idProduk = r.json?.data?.id;
  return r.status === 201 && Number.isInteger(idProduk);
});
await uji("C5 PATCH/DELETE peran user -> 403", async () => {
  const a = await req("PATCH", `/produk/${idProduk}`, { token: budi.token, body: { stok: 1 } });
  const b = await req("DELETE", `/produk/${idProduk}`, { token: budi.token });
  return a.status === 403 && b.status === 403;
});
await uji("C6 DELETE admin -> 204", async () => (await req("DELETE", `/produk/${idProduk}`, { token: admin.token })).status === 204);

// ================= D. Kepemilikan data (IDOR) =================
let pesananBudi;
await uji("D1 POST /pesanan: pemilik dari token, penggunaId palsu diabaikan", async () => {
  const r = await req("POST", "/pesanan", {
    token: budi.token,
    body: { penggunaId: sari.pengguna.id, item: [{ produkId: 7, jumlah: 1 }] },
  });
  pesananBudi = r.json?.data;
  return r.status === 201 && pesananBudi.pengguna.id === budi.pengguna.id;
});
await uji("D2 GET /pesanan (user) hanya milik sendiri", async () => {
  const r = await req("GET", "/pesanan", { token: budi.token });
  return r.status === 200 && r.json.data.length >= 1 && r.json.data.every((p) => p.pengguna.id === budi.pengguna.id);
});
await uji("D3 GET /pesanan (admin) melihat semua pengguna", async () => {
  const r = await req("GET", "/pesanan", { token: admin.token });
  const ids = new Set(r.json.data.map((p) => p.pengguna.id));
  return r.status === 200 && ids.size >= 2;
});
await uji("D4 IDOR: user lain membaca pesanan -> 404", async () => {
  const a = await req("GET", `/pesanan/${pesananBudi.id}`, { token: sari.token });
  const b = await req("GET", "/pesanan/999999", { token: sari.token });
  return a.status === 404 && b.status === 404 && a.json.error.kode === b.json.error.kode;
});
await uji("D5 pemilik dan admin dapat membaca pesanan", async () => {
  const a = await req("GET", `/pesanan/${pesananBudi.id}`, { token: budi.token });
  const b = await req("GET", `/pesanan/${pesananBudi.id}`, { token: admin.token });
  return a.status === 200 && b.status === 200;
});

// ================= E. Header & CORS =================
await uji("E1 header keamanan (nosniff) dan tanpa X-Powered-By", async () => {
  const r = await req("GET", "/kesehatan");
  return r.headers.get("x-content-type-options") === "nosniff" && !r.headers.get("x-powered-by");
});
await uji("E2 CORS: origin asing tidak diizinkan", async () => {
  const r = await req("GET", "/produk", { headers: { Origin: "https://situs-jahat.example" } });
  return r.status === 200 && !r.headers.get("access-control-allow-origin");
});

// ================= F. Pembatas laju (JALANKAN TERAKHIR) =================
await uji("F1 login salah beruntun -> akhirnya 429", async () => {
  let kena = false;
  for (let i = 0; i < 30 && !kena; i++) {
    const r = await req("POST", "/auth/masuk", { body: { email: "bruteforce@contoh.id", password: "TebakanKe-" + i } });
    if (r.status === 429) kena = r.json?.error?.kode === "TERLALU_BANYAK_PERCOBAAN";
  }
  return kena;
});

for (const h of hasil) console.log(`${h.ok ? "LULUS" : "GAGAL"}  ${h.nama}`);
console.log(`\nSkor: ${lulus}/${hasil.length}`);
process.exitCode = lulus === hasil.length ? 0 : 1;
