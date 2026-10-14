// Smoke test kontrak API pertemuan 7 (kontrak pertemuan 6 + pesanan).
// Jalankan setelah server aktif:  npm run smoke
// Mulai dari data bersih untuk hasil konsisten:  npm run db:reset

const BASE = process.env.BASE ?? "http://localhost:3000";
const API = `${BASE}/api/v1`;

const hasil = [];
let lulus = 0;

async function req(method, path, body) {
  const opsi = { method, headers: { Accept: "application/json" } };
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

async function uji(nama, fn, { bonus = false } = {}) {
  try {
    const ok = Boolean(await fn());
    hasil.push({ nama, ok, bonus });
    if (ok && !bonus) lulus++;
  } catch (e) {
    hasil.push({ nama: `${nama}  [error: ${e.message}]`, ok: false, bonus });
  }
}

const stokProduk = async (id) => (await req("GET", `/produk/${id}`)).json?.data?.stok;
const hargaProduk = async (id) => (await req("GET", `/produk/${id}`)).json?.data?.harga;

// ================= BAGIAN A: kontrak produk (dari pertemuan 6) =================
await uji("A1 GET /kesehatan", async () => (await req("GET", "/kesehatan")).json?.status === "ok");
await uji("A2 rute tak dikenal -> 404", async () => (await req("GET", "/tidak-ada")).status === 404);

await uji("A3 GET /produk -> data[] + meta", async () => {
  const r = await req("GET", "/produk");
  return r.status === 200 && Array.isArray(r.json?.data) && typeof r.json?.meta?.total === "number" && r.json.data[0]?.kategori === "kopi";
});
await uji("A4 filter kategori=teh", async () => {
  const r = await req("GET", "/produk?kategori=teh");
  return r.json.data.length === 3 && r.json.data.every((p) => p.kategori === "teh");
});
await uji("A5 pencarian q=GAYO", async () => {
  const r = await req("GET", "/produk?q=GAYO");
  return r.json.data.length >= 1 && r.json.data.every((p) => p.nama.toLowerCase().includes("gayo"));
});
await uji("A6 urut=-harga menurun", async () => {
  const r = await req("GET", "/produk?urut=-harga&batas=100");
  const h = r.json.data.map((p) => p.harga);
  return h.length > 1 && h.every((v, i) => i === 0 || h[i - 1] >= v);
});
await uji("A7 paginasi halaman=2&batas=3", async () => {
  const r = await req("GET", "/produk?halaman=2&batas=3");
  return r.json.data.length === 3 && r.json.meta.halaman === 2 && r.json.meta.total >= 10;
});
await uji("A8 batas dibatasi <= 100", async () => (await req("GET", "/produk?batas=100000")).json.meta.batas <= 100);
await uji("A9 urut tidak valid -> 400", async () => (await req("GET", "/produk?urut=password")).status === 400);
await uji("A10 detail 200 / 404 / 400", async () => {
  const a = await req("GET", "/produk/1");
  const b = await req("GET", "/produk/99999");
  const c = await req("GET", "/produk/abc");
  return a.status === 200 && a.json.data.id === 1 && b.status === 404 && c.status === 400;
});

let idBaru;
await uji("A11 POST valid -> 201 + Location", async () => {
  const r = await req("POST", "/produk", { nama: "Kopi Bali Kintamani", harga: 70000, stok: 10, kategori: "kopi" });
  idBaru = r.json?.data?.id;
  return r.status === 201 && Number.isInteger(idBaru) && (r.headers.get("location") ?? "").endsWith(`/produk/${idBaru}`);
});
await uji("A12 POST tidak valid -> 422 detail[]", async () => {
  const r = await req("POST", "/produk", { nama: "K", harga: -1, stok: 1, kategori: "mobil" });
  return r.status === 422 && r.json.error.detail.length >= 3;
});
await uji("A13 POST JSON rusak -> 400", async () => (await req("POST", "/produk", '{"nama":')).status === 400);
await uji("A14 mass assignment diabaikan", async () => {
  const r = await req("POST", "/produk", { nama: "Kopi Aman", harga: 1000, stok: 1, kategori: "kopi", id: 99999, admin: true });
  return r.status === 201 && r.json.data.id !== 99999 && r.json.data.admin === undefined;
});
await uji("A15 PUT lengkap -> 200", async () => {
  const r = await req("PUT", `/produk/${idBaru}`, { nama: "Kopi Bali Super", harga: 75000, stok: 5, kategori: "teh" });
  return r.status === 200 && r.json.data.nama === "Kopi Bali Super" && r.json.data.kategori === "teh";
});
await uji("A16 PATCH sebagian -> 200", async () => {
  const r = await req("PATCH", `/produk/${idBaru}`, { stok: 99 });
  return r.status === 200 && r.json.data.stok === 99 && r.json.data.nama === "Kopi Bali Super";
});
await uji("A17 PATCH body kosong -> 422", async () => (await req("PATCH", `/produk/${idBaru}`, {})).status === 422);
await uji("A18 PUT/PATCH id tak ada -> 404", async () => {
  const a = await req("PUT", "/produk/99999", { nama: "Kopi Zzz", harga: 1, stok: 1, kategori: "kopi" });
  const b = await req("PATCH", "/produk/99999", { stok: 1 });
  return a.status === 404 && b.status === 404;
});
await uji("A19 DELETE -> 204, ulang -> 404", async () => {
  const a = await req("DELETE", `/produk/${idBaru}`);
  const b = await req("DELETE", `/produk/${idBaru}`);
  return a.status === 204 && a.teks === "" && b.status === 404;
});

// ================= BAGIAN B: pesanan, N+1, transaksi =================
let kueriBaik = 0;
await uji("B1 GET /pesanan -> data lengkap (pengguna + item)", async () => {
  const r = await req("GET", "/pesanan");
  kueriBaik = Number(r.headers.get("x-jumlah-query"));
  const p = r.json?.data?.[0];
  return r.status === 200 && r.json.data.length >= 3 && typeof p?.pengguna?.email === "string" && p.item.length >= 1 && typeof p.item[0].namaProduk === "string";
});
await uji("B2 versi baik: jumlah kueri tetap (<= 6)", async () => Number.isFinite(kueriBaik) && kueriBaik > 0 && kueriBaik <= 6);
await uji("B3 versi buruk: jumlah kueri LEBIH BANYAK, hasil sama", async () => {
  const baik = await req("GET", "/pesanan");
  const buruk = await req("GET", "/pesanan?mode=buruk");
  const kBuruk = Number(buruk.headers.get("x-jumlah-query"));
  const idBaik = baik.json.data.map((p) => p.id).join(",");
  const idBuruk = buruk.json.data.map((p) => p.id).join(",");
  return kBuruk > kueriBaik && idBaik === idBuruk;
});
await uji("B4 GET /pesanan/:id", async () => {
  const a = await req("GET", "/pesanan/1");
  const b = await req("GET", "/pesanan/99999");
  return a.status === 200 && a.json.data.id === 1 && b.status === 404;
});

await uji("B5 POST pesanan valid -> 201, total benar, stok berkurang", async () => {
  const harga = await hargaProduk(3);
  const stokAwal = await stokProduk(3);
  const r = await req("POST", "/pesanan", { penggunaId: 1, item: [{ produkId: 3, jumlah: 2 }] });
  const stokAkhir = await stokProduk(3);
  return r.status === 201 && r.json.data.total === harga * 2 && r.json.data.item[0].hargaSatuan === harga &&
    stokAkhir === stokAwal - 2 && (r.headers.get("location") ?? "").includes("/pesanan/");
});
await uji("B6 stok tidak cukup -> 409, stok tidak berubah", async () => {
  const stokAwal = await stokProduk(3);
  const r = await req("POST", "/pesanan", { penggunaId: 1, item: [{ produkId: 3, jumlah: stokAwal + 1 }] });
  return r.status === 409 && (await stokProduk(3)) === stokAwal;
});
await uji("B7 ATOMIK: item kedua gagal -> item pertama di-rollback", async () => {
  const stokAwal = await stokProduk(1);
  // produk 2 bernilai stok 0 pada seed -> item kedua pasti gagal
  const r = await req("POST", "/pesanan", { penggunaId: 1, item: [{ produkId: 1, jumlah: 1 }, { produkId: 2, jumlah: 1 }] });
  return r.status === 409 && (await stokProduk(1)) === stokAwal;
});
await uji("B8 pengguna tidak ada -> 422", async () =>
  (await req("POST", "/pesanan", { penggunaId: 99999, item: [{ produkId: 1, jumlah: 1 }] })).status === 422);
await uji("B9 item kosong / duplikat -> 422", async () => {
  const a = await req("POST", "/pesanan", { penggunaId: 1, item: [] });
  const b = await req("POST", "/pesanan", { penggunaId: 1, item: [{ produkId: 1, jumlah: 1 }, { produkId: 1, jumlah: 1 }] });
  return a.status === 422 && b.status === 422;
});
await uji("B10 hapus produk yang sudah dipesan -> 409", async () => (await req("DELETE", "/produk/3")).status === 409);

// ================= BONUS: migrasi #2 (tidak dihitung) =================
await uji("BONUS Migrasi #2: deskripsi opsional tersimpan", async () => {
  const r = await req("POST", "/produk", { nama: "Kopi Berdeskripsi", harga: 50000, stok: 1, kategori: "kopi", deskripsi: "Sangrai medium" });
  const ok = r.status === 201 && r.json.data.deskripsi === "Sangrai medium";
  if (r.json?.data?.id) await req("DELETE", `/produk/${r.json.data.id}`);
  return ok;
}, { bonus: true });

for (const h of hasil) console.log(`${h.ok ? "LULUS" : h.bonus ? "BELUM" : "GAGAL"}  ${h.nama}`);
const wajib = hasil.filter((h) => !h.bonus).length;
console.log(`\nSkor: ${lulus}/${wajib}`);
process.exitCode = lulus === wajib ? 0 : 1;
