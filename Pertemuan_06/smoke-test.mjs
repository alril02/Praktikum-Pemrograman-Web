// Smoke test kontrak API. Jalankan SETELAH server aktif:
//   terminal 1: npm run dev
//   terminal 2: npm run smoke        (atau: BASE=http://localhost:3000 node smoke-test.mjs)
//
// Pengujian ini bergantung pada data awal store (10 produk). Mulai ulang server bila perlu.

const BASE = process.env.BASE ?? "http://localhost:3000";
const API = `${BASE}/api/v1`;

const hasil = [];
let lulus = 0;

async function req(method, path, body, headers = {}) {
  const opsi = { method, headers: { Accept: "application/json", ...headers } };
  if (body !== undefined) {
    opsi.headers["Content-Type"] = "application/json";
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
    const ok = await fn();
    hasil.push({ nama, ok: Boolean(ok) });
    if (ok) lulus++;
  } catch (e) {
    hasil.push({ nama: `${nama}  [error: ${e.message}]`, ok: false });
  }
}

// ---------- Kesehatan & dasar ----------
await uji("GET /kesehatan -> 200 {status:'ok'}", async () => {
  const r = await req("GET", "/kesehatan");
  return r.status === 200 && r.json?.status === "ok";
});

await uji("Rute tak dikenal -> 404 JSON {error.kode}", async () => {
  const r = await req("GET", "/tidak-ada");
  return r.status === 404 && typeof r.json?.error?.kode === "string";
});

// ---------- Baca ----------
await uji("GET /produk -> 200 {data[], meta}", async () => {
  const r = await req("GET", "/produk");
  return r.status === 200 && Array.isArray(r.json?.data) && r.json?.meta && typeof r.json.meta.total === "number";
});

await uji("GET /produk?kategori=teh -> hanya teh", async () => {
  const r = await req("GET", "/produk?kategori=teh");
  return r.status === 200 && r.json.data.length > 0 && r.json.data.every((p) => p.kategori === "teh");
});

await uji("GET /produk?q=GAYO -> tidak peka huruf besar-kecil", async () => {
  const r = await req("GET", "/produk?q=GAYO");
  return r.status === 200 && r.json.data.length === 1 && r.json.data[0].id === 1;
});

await uji("GET /produk?urut=-harga -> menurun", async () => {
  const r = await req("GET", "/produk?urut=-harga");
  const h = r.json?.data?.map((p) => p.harga) ?? [];
  return r.status === 200 && h.length > 1 && h.every((v, i) => i === 0 || h[i - 1] >= v);
});

await uji("Paginasi: halaman=2&batas=3 -> 3 item, meta benar", async () => {
  const r = await req("GET", "/produk?halaman=2&batas=3");
  return r.status === 200 && r.json.data.length === 3 && r.json.meta.halaman === 2 && r.json.meta.batas === 3;
});

await uji("Paginasi: batas=100000 dibatasi (<=100)", async () => {
  const r = await req("GET", "/produk?batas=100000");
  return r.status === 200 && r.json.meta.batas <= 100;
});

await uji("GET /produk/1 -> 200", async () => {
  const r = await req("GET", "/produk/1");
  return r.status === 200 && r.json?.data?.id === 1;
});

await uji("GET /produk/9999 -> 404", async () => (await req("GET", "/produk/9999")).status === 404);
await uji("GET /produk/abc -> 400", async () => (await req("GET", "/produk/abc")).status === 400);

// ---------- Buat ----------
let idBaru;
await uji("POST valid -> 201 + Location + data", async () => {
  const r = await req("POST", "/produk", { nama: "Kopi Bali Kintamani", harga: 70000, stok: 10, kategori: "kopi" });
  idBaru = r.json?.data?.id;
  const loc = r.headers.get("location") ?? "";
  return r.status === 201 && Number.isInteger(idBaru) && loc.endsWith(`/produk/${idBaru}`);
});

await uji("POST harga negatif -> 422 dengan detail[]", async () => {
  const r = await req("POST", "/produk", { nama: "Kopi X", harga: -1, stok: 1, kategori: "kopi" });
  return r.status === 422 && Array.isArray(r.json?.error?.detail) && r.json.error.detail.some((d) => d.field === "harga");
});

await uji("POST kategori tidak dikenal -> 422", async () => {
  const r = await req("POST", "/produk", { nama: "Kopi X", harga: 1000, stok: 1, kategori: "mobil" });
  return r.status === 422;
});

await uji("POST JSON rusak -> 400 (bukan 500)", async () => {
  const r = await req("POST", "/produk", '{"nama": "Kopi",');
  return r.status === 400 && typeof r.json?.error?.kode === "string";
});

await uji("POST tidak menerima field asing (mass assignment)", async () => {
  const r = await req("POST", "/produk", { nama: "Kopi Aman", harga: 1000, stok: 1, kategori: "kopi", id: 9999, admin: true });
  return r.status === 201 && r.json.data.id !== 9999 && r.json.data.admin === undefined;
});

// ---------- Ganti / Ubah ----------
await uji("PUT lengkap -> 200 dan data diganti", async () => {
  const r = await req("PUT", `/produk/${idBaru}`, { nama: "Kopi Bali Super", harga: 75000, stok: 5, kategori: "kopi" });
  return r.status === 200 && r.json?.data?.nama === "Kopi Bali Super" && r.json.data.harga === 75000;
});

await uji("PUT tidak lengkap -> 422", async () => {
  const r = await req("PUT", `/produk/${idBaru}`, { nama: "Hanya nama" });
  return r.status === 422;
});

await uji("PUT id tidak ada -> 404", async () => {
  const r = await req("PUT", "/produk/9999", { nama: "Kopi Zzz", harga: 1, stok: 1, kategori: "kopi" });
  return r.status === 404;
});

await uji("PATCH sebagian -> 200, field lain tetap", async () => {
  const r = await req("PATCH", `/produk/${idBaru}`, { stok: 99 });
  return r.status === 200 && r.json.data.stok === 99 && r.json.data.nama === "Kopi Bali Super";
});

await uji("PATCH nilai tidak valid -> 422", async () => {
  const r = await req("PATCH", `/produk/${idBaru}`, { harga: "murah" });
  return r.status === 422;
});

await uji("PATCH body kosong -> 422", async () => {
  const r = await req("PATCH", `/produk/${idBaru}`, {});
  return r.status === 422;
});

await uji("PATCH tidak dapat mengubah id", async () => {
  const r = await req("PATCH", `/produk/${idBaru}`, { id: 1, stok: 98 });
  return r.status === 200 && r.json.data.id === idBaru;
});

// ---------- Hapus ----------
await uji("DELETE -> 204 tanpa body", async () => {
  const r = await req("DELETE", `/produk/${idBaru}`);
  return r.status === 204 && r.teks === "";
});

await uji("DELETE ulang -> 404", async () => (await req("DELETE", `/produk/${idBaru}`)).status === 404);
await uji("GET setelah DELETE -> 404", async () => (await req("GET", `/produk/${idBaru}`)).status === 404);

// ---------- Cetak ----------
for (const h of hasil) console.log(`${h.ok ? "LULUS" : "GAGAL"}  ${h.nama}`);
console.log(`\nSkor: ${lulus}/${hasil.length}`);
process.exitCode = lulus === hasil.length ? 0 : 1;
