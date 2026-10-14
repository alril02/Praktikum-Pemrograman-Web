import * as store from "../data/produk.store.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";

// ---------- Utilitas ----------
function ambilId(req) {
  const mentah = req.params.id;
  if (!/^\d+$/.test(mentah)) {
    throw new HttpError(400, "ID_TIDAK_VALID", "ID harus berupa bilangan bulat positif");
  }
  return Number(mentah);
}

// Validasi data produk.
//   penuh = true  -> semua field wajib (POST/PUT)
//   penuh = false -> hanya field yang dikirim yang diperiksa (PATCH)
// Mengembalikan { data (hanya field yang diizinkan), detail (daftar masalah) }
function validasiProduk(body, { penuh }) {
  const detail = [];
  const data = {};
  const sumber = body && typeof body === "object" && !Array.isArray(body) ? body : {};

  const ada = (k) => Object.hasOwn(sumber, k);

  // nama: string 3-100 karakter
  if (penuh || ada("nama")) {
    const nilai = typeof sumber.nama === "string" ? sumber.nama.trim() : sumber.nama;
    if (typeof nilai !== "string" || nilai.length < 3 || nilai.length > 100) {
      detail.push({ field: "nama", pesan: "Harus teks 3-100 karakter" });
    } else data.nama = nilai;
  }

  // harga: bilangan bulat >= 0
  if (penuh || ada("harga")) {
    if (!Number.isInteger(sumber.harga) || sumber.harga < 0) {
      detail.push({ field: "harga", pesan: "Harus bilangan bulat >= 0" });
    } else data.harga = sumber.harga;
  }

  // stok: bilangan bulat >= 0
  if (penuh || ada("stok")) {
    if (!Number.isInteger(sumber.stok) || sumber.stok < 0) {
      detail.push({ field: "stok", pesan: "Harus bilangan bulat >= 0" });
    } else data.stok = sumber.stok;
  }

  // kategori: salah satu dari KATEGORI
  if (penuh || ada("kategori")) {
    if (!store.KATEGORI.includes(sumber.kategori)) {
      detail.push({ field: "kategori", pesan: `Harus salah satu dari: ${store.KATEGORI.join(", ")}` });
    } else data.kategori = sumber.kategori;
  }

  return { data, detail };
}

// ---------- Handler ----------

// GET /api/v1/produk?kategori=&q=&urut=&halaman=&batas=
// TODO 1: lengkapi filter (kategori, q), pengurutan (urut, whitelist: nama,harga; awalan "-" = turun),
//         dan paginasi (halaman >= 1, batas 1..100, default 10).
//         Kembalikan { data, meta: { halaman, batas, total, totalHalaman } }.
export function daftar(req, res) {
  const hasil = store.semua();
  res.json({
    data: hasil,
    meta: { halaman: 1, batas: hasil.length, total: hasil.length, totalHalaman: 1 },
  });
}

// GET /api/v1/produk/:id
export function detail(req, res) {
  const id = ambilId(req);
  const item = store.cariId(id);
  if (!item) throw tidakDitemukan("Produk tidak ditemukan");
  res.json({ data: item });
}

// POST /api/v1/produk  -> 201 + Location
// TODO 2: validasiProduk(req.body, { penuh: true }); bila ada detail lempar validasiGagal(detail);
//         simpan dengan store.tambah(data); kirim 201 dan header Location: /api/v1/produk/{id}
export function buat(req, res) {
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "POST belum diimplementasikan");
}

// PUT /api/v1/produk/:id -> ganti seluruh representasi
// TODO 3: validasi penuh; 404 bila tidak ada; 200 dengan data baru
export function ganti(req, res) {
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "PUT belum diimplementasikan");
}

// PATCH /api/v1/produk/:id -> ubah sebagian
// TODO 4: validasi parsial; tolak body kosong (422); 404 bila tidak ada; 200
export function ubah(req, res) {
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "PATCH belum diimplementasikan");
}

// DELETE /api/v1/produk/:id -> 204
// TODO 5: 404 bila tidak ada; selain itu hapus dan kirim 204 tanpa body
export function hapus(req, res) {
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "DELETE belum diimplementasikan");
}
