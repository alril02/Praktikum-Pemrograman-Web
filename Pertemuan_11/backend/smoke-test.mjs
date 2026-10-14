// Smoke test pertemuan 11: validasi Zod + unggah gambar aman.
// Jalankan setelah server aktif:  npm run smoke
// (Ada login admin dan user; tunggu 1 menit bila baru saja menjalankan smoke test pertemuan 10.)

const BASE = process.env.BASE ?? "http://localhost:3000";
const API = `${BASE}/api/v1`;

const KRED = {
  admin: [process.env.ADMIN_EMAIL ?? "admin@contoh.id", process.env.ADMIN_PASS ?? "AdminRahasia#2026"],
  budi: [process.env.BUDI_EMAIL ?? "budi@contoh.id", process.env.BUDI_PASS ?? "BudiRahasia#2026"],
};

const hasil = [];
let lulus = 0;

async function req(method, path, { body, token, form, headers = {} } = {}) {
  const h = { Accept: "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const opsi = { method, headers: h };
  if (form) opsi.body = form; // FormData: biarkan fetch mengisi Content-Type + boundary
  else if (body !== undefined) {
    h["Content-Type"] = "application/json";
    opsi.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const r = await fetch(path.startsWith("http") ? path : API + path, opsi);
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

// PNG 1x1 valid
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function formBerkas(isi, namaBerkas, tipe, namaField = "gambar") {
  const fd = new FormData();
  fd.append(namaField, new Blob([isi], { type: tipe }), namaBerkas);
  return fd;
}

async function login([email, password]) {
  const r = await req("POST", "/auth/masuk", { body: { email, password } });
  return r.json?.data?.token;
}
const tokenAdmin = await login(KRED.admin);
const tokenUser = await login(KRED.budi);

// ================= A. Validasi Zod =================
await uji("A0 login admin dan user berhasil", async () => Boolean(tokenAdmin && tokenUser));

await uji("A1 POST kosong -> 422 dengan galat per field (nama, harga, stok, kategori)", async () => {
  const r = await req("POST", "/produk", { token: tokenAdmin, body: {} });
  const f = new Set((r.json?.error?.detail ?? []).map((d) => d.field));
  return r.status === 422 && ["nama", "harga", "stok", "kategori"].every((k) => f.has(k));
});

await uji("A2 pesan galat berbahasa Indonesia dan spesifik", async () => {
  const r = await req("POST", "/produk", { token: tokenAdmin, body: { nama: "K", harga: -5, stok: 1.5, kategori: "kopi" } });
  const peta = Object.fromEntries((r.json?.error?.detail ?? []).map((d) => [d.field, d.pesan]));
  return r.status === 422 && /3 karakter/i.test(peta.nama ?? "") && /negatif/i.test(peta.harga ?? "") && /bulat/i.test(peta.stok ?? "");
});

await uji("A3 tipe salah (harga string) -> 422 pada field harga", async () => {
  const r = await req("POST", "/produk", { token: tokenAdmin, body: { nama: "Kopi Uji", harga: "murah", stok: 1, kategori: "kopi" } });
  return r.status === 422 && r.json.error.detail.some((d) => d.field === "harga");
});

await uji("A4 field asing ditolak (strict) -> 422 menyebut field", async () => {
  const r = await req("POST", "/produk", {
    token: tokenAdmin,
    body: { nama: "Kopi Uji", harga: 1000, stok: 1, kategori: "kopi", id: 999, peran: "admin" },
  });
  const f = new Set((r.json?.error?.detail ?? []).map((d) => d.field));
  return r.status === 422 && f.has("id") && f.has("peran");
});

let idProduk;
await uji("A5 POST valid -> 201 + deskripsi opsional", async () => {
  const r = await req("POST", "/produk", {
    token: tokenAdmin,
    body: { nama: "  Kopi Uji Unggah  ", harga: 55000, stok: 7, kategori: "kopi", deskripsi: "Sangrai medium" },
  });
  idProduk = r.json?.data?.id;
  return r.status === 201 && r.json.data.nama === "Kopi Uji Unggah" && r.json.data.deskripsi === "Sangrai medium" && r.json.data.gambar === null;
});

await uji("A6 PATCH body kosong -> 422; PATCH field asing -> 422; PATCH valid -> 200", async () => {
  const a = await req("PATCH", `/produk/${idProduk}`, { token: tokenAdmin, body: {} });
  const b = await req("PATCH", `/produk/${idProduk}`, { token: tokenAdmin, body: { dibuat: "x" } });
  const c = await req("PATCH", `/produk/${idProduk}`, { token: tokenAdmin, body: { stok: 3 } });
  return a.status === 422 && b.status === 422 && c.status === 200 && c.json.data.stok === 3;
});

// ================= B. Unggah gambar =================
let urlGambar;
await uji("B1 unggah PNG valid (admin) -> 200, gambar = /uploads/<uuid>.png", async () => {
  const r = await req("POST", `/produk/${idProduk}/gambar`, {
    token: tokenAdmin,
    form: formBerkas(PNG_1PX, "kopi saya.png", "image/png"),
  });
  urlGambar = r.json?.data?.gambar;
  return r.status === 200 && /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/.test(urlGambar ?? "");
});

await uji("B2 berkas dapat diunduh dengan tipe & header aman", async () => {
  const r = await fetch(BASE + urlGambar);
  const buf = Buffer.from(await r.arrayBuffer());
  return (
    r.status === 200 &&
    r.headers.get("content-type") === "image/png" &&
    r.headers.get("x-content-type-options") === "nosniff" &&
    r.headers.get("cross-origin-resource-policy") === "cross-origin" &&
    buf.equals(PNG_1PX)
  );
});

await uji("B3 nama berkas klien (path traversal) TIDAK dipakai", async () => {
  const r = await req("POST", `/produk/${idProduk}/gambar`, {
    token: tokenAdmin,
    form: formBerkas(PNG_1PX, "../../../evil.png", "image/png"),
  });
  const g = r.json?.data?.gambar ?? "";
  return r.status === 200 && !g.includes("evil") && !g.includes("..") && g !== urlGambar;
});

await uji("B4 berkas lama dibersihkan setelah diganti", async () => {
  const r = await fetch(BASE + urlGambar);
  return r.status === 404;
});

await uji("B5 berkas teks berpura-pura PNG (mimetype+ekstensi palsu) -> 415", async () => {
  const r = await req("POST", `/produk/${idProduk}/gambar`, {
    token: tokenAdmin,
    form: formBerkas(Buffer.from("<script>alert('xss')</script>"), "foto.png", "image/png"),
  });
  return r.status === 415 && r.json?.error?.kode === "TIPE_BERKAS_TIDAK_DIDUKUNG";
});

await uji("B6 SVG ditolak -> 415", async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>');
  const r = await req("POST", `/produk/${idProduk}/gambar`, { token: tokenAdmin, form: formBerkas(svg, "x.svg", "image/svg+xml") });
  return r.status === 415;
});

await uji("B7 berkas terlalu besar (> 2 MB) -> 413", async () => {
  const besar = Buffer.concat([PNG_1PX, Buffer.alloc(3 * 1024 * 1024)]);
  const r = await req("POST", `/produk/${idProduk}/gambar`, { token: tokenAdmin, form: formBerkas(besar, "besar.png", "image/png") });
  return r.status === 413;
});

await uji("B8 field tidak sesuai / tanpa berkas -> 422", async () => {
  const a = await req("POST", `/produk/${idProduk}/gambar`, { token: tokenAdmin, form: formBerkas(PNG_1PX, "a.png", "image/png", "file") });
  const b = await req("POST", `/produk/${idProduk}/gambar`, { token: tokenAdmin, form: new FormData() });
  return a.status === 422 && b.status === 422;
});

await uji("B9 tanpa token -> 401; peran user -> 403", async () => {
  const a = await req("POST", `/produk/${idProduk}/gambar`, { form: formBerkas(PNG_1PX, "a.png", "image/png") });
  const b = await req("POST", `/produk/${idProduk}/gambar`, { token: tokenUser, form: formBerkas(PNG_1PX, "a.png", "image/png") });
  return a.status === 401 && b.status === 403;
});

await uji("B10 produk tidak ada -> 404; id tidak valid -> 400", async () => {
  const a = await req("POST", "/produk/999999/gambar", { token: tokenAdmin, form: formBerkas(PNG_1PX, "a.png", "image/png") });
  const b = await req("POST", "/produk/abc/gambar", { token: tokenAdmin, form: formBerkas(PNG_1PX, "a.png", "image/png") });
  return a.status === 404 && b.status === 400;
});

await uji("B11 jalur /uploads tidak dapat menelusuri direktori", async () => {
  const a = await fetch(BASE + "/uploads/");
  const b = await fetch(BASE + "/uploads/..%2f..%2fpackage.json");
  return a.status !== 200 && b.status !== 200;
});

// ================= C. Pembersihan =================
await uji("C1 DELETE produk uji -> 204", async () => (await req("DELETE", `/produk/${idProduk}`, { token: tokenAdmin })).status === 204);

for (const h of hasil) console.log(`${h.ok ? "LULUS" : "GAGAL"}  ${h.nama}`);
console.log(`\nSkor: ${lulus}/${hasil.length}`);
process.exitCode = lulus === hasil.length ? 0 : 1;
