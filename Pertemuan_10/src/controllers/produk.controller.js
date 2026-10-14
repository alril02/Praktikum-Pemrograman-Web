// Controller TIDAK tahu detail database: ia memanggil repositori.
// Kontrak HTTP sama dengan pertemuan 6 (smoke test lama tetap harus lolos).
import * as repo from "../repositories/produk.repo.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";

// Harus sinkron dengan kategori pada prisma/seed.js
export const KATEGORI = ["kopi", "teh", "gula", "alat"];
const KOLOM_URUT = new Set(["nama", "harga"]);

function ambilId(req) {
  const mentah = req.params.id;
  if (!/^\d+$/.test(mentah)) {
    throw new HttpError(400, "ID_TIDAK_VALID", "ID harus berupa bilangan bulat positif");
  }
  return Number(mentah);
}

function validasiProduk(body, { penuh }) {
  const detail = [];
  const data = {};
  const sumber = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const ada = (k) => Object.hasOwn(sumber, k);

  if (penuh || ada("nama")) {
    const nilai = typeof sumber.nama === "string" ? sumber.nama.trim() : sumber.nama;
    if (typeof nilai !== "string" || nilai.length < 3 || nilai.length > 100) {
      detail.push({ field: "nama", pesan: "Harus teks 3-100 karakter" });
    } else data.nama = nilai;
  }
  if (penuh || ada("harga")) {
    if (!Number.isInteger(sumber.harga) || sumber.harga < 0) {
      detail.push({ field: "harga", pesan: "Harus bilangan bulat >= 0" });
    } else data.harga = sumber.harga;
  }
  if (penuh || ada("stok")) {
    if (!Number.isInteger(sumber.stok) || sumber.stok < 0) {
      detail.push({ field: "stok", pesan: "Harus bilangan bulat >= 0" });
    } else data.stok = sumber.stok;
  }
  if (penuh || ada("kategori")) {
    if (!KATEGORI.includes(sumber.kategori)) {
      detail.push({ field: "kategori", pesan: `Harus salah satu dari: ${KATEGORI.join(", ")}` });
    } else data.kategori = sumber.kategori;
  }

  // TODO (Migrasi #2): setelah menambah kolom `deskripsi`, terima field opsional ini:
  //   if (ada("deskripsi")) { string maks 500 karakter, boleh null -> data.deskripsi }

  return { data, detail };
}

export async function daftar(req, res) {
  const { kategori, q, urut } = req.query;

  let kolom = null;
  let arah = "asc";
  if (typeof urut === "string" && urut) {
    arah = urut.startsWith("-") ? "desc" : "asc";
    kolom = urut.replace(/^-/, "");
    if (!KOLOM_URUT.has(kolom)) {
      throw new HttpError(400, "URUT_TIDAK_VALID", `urut harus salah satu dari: ${[...KOLOM_URUT].join(", ")}`);
    }
  }

  const halaman = Math.max(1, Number.parseInt(req.query.halaman, 10) || 1);
  const batas = Math.min(100, Math.max(1, Number.parseInt(req.query.batas, 10) || 10));

  const { data, total } = await repo.daftar({
    kategori: typeof kategori === "string" && kategori ? kategori : undefined,
    q: typeof q === "string" && q.trim() ? q.trim() : undefined,
    kolom,
    arah,
    halaman,
    batas,
  });

  res.json({
    data,
    meta: { halaman, batas, total, totalHalaman: Math.max(1, Math.ceil(total / batas)) },
  });
}

export async function detail(req, res) {
  const item = await repo.cariId(ambilId(req));
  if (!item) throw tidakDitemukan("Produk tidak ditemukan");
  res.json({ data: item });
}

export async function buat(req, res) {
  const { data, detail } = validasiProduk(req.body, { penuh: true });
  if (detail.length) throw validasiGagal(detail);
  const baru = await repo.tambah(data);
  res.status(201).location(`/api/v1/produk/${baru.id}`).json({ data: baru });
}

export async function ganti(req, res) {
  const id = ambilId(req);
  if (!(await repo.cariId(id))) throw tidakDitemukan("Produk tidak ditemukan");
  const { data, detail } = validasiProduk(req.body, { penuh: true });
  if (detail.length) throw validasiGagal(detail);
  res.json({ data: await repo.ganti(id, data) });
}

export async function ubah(req, res) {
  const id = ambilId(req);
  if (!(await repo.cariId(id))) throw tidakDitemukan("Produk tidak ditemukan");
  const { data, detail } = validasiProduk(req.body, { penuh: false });
  if (detail.length) throw validasiGagal(detail);
  if (Object.keys(data).length === 0) {
    throw validasiGagal([{ field: "_body", pesan: "Sertakan minimal satu field yang diubah" }]);
  }
  res.json({ data: await repo.ubah(id, data) });
}

export async function hapus(req, res) {
  const id = ambilId(req);
  const berhasil = await repo.hapus(id); // P2003 (masih dipesan) ditangani errorHandler -> 409
  if (!berhasil) throw tidakDitemukan("Produk tidak ditemukan");
  res.status(204).end();
}
