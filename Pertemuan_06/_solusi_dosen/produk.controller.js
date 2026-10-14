// KUNCI JAWABAN DOSEN - jangan dibagikan ke mahasiswa sebelum tenggat.
// Salin berkas-berkas di folder ini menimpa berkas bertanda TODO pada src/.
import * as store from "../data/produk.store.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";

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
    if (!store.KATEGORI.includes(sumber.kategori)) {
      detail.push({ field: "kategori", pesan: `Harus salah satu dari: ${store.KATEGORI.join(", ")}` });
    } else data.kategori = sumber.kategori;
  }
  return { data, detail };
}

const KOLOM_URUT = new Set(["nama", "harga"]);

export function daftar(req, res) {
  const { kategori, q, urut } = req.query;
  let hasil = store.semua();

  if (typeof kategori === "string" && kategori) hasil = hasil.filter((p) => p.kategori === kategori);
  if (typeof q === "string" && q.trim()) {
    const kata = q.trim().toLowerCase();
    hasil = hasil.filter((p) => p.nama.toLowerCase().includes(kata));
  }

  if (typeof urut === "string" && urut) {
    const turun = urut.startsWith("-");
    const kolom = turun ? urut.slice(1) : urut;
    if (!KOLOM_URUT.has(kolom)) {
      throw new HttpError(400, "URUT_TIDAK_VALID", `urut harus salah satu dari: ${[...KOLOM_URUT].join(", ")}`);
    }
    hasil.sort((a, b) => {
      const sel = a[kolom] < b[kolom] ? -1 : a[kolom] > b[kolom] ? 1 : 0;
      return turun ? -sel : sel;
    });
  }

  const halaman = Math.max(1, Number.parseInt(req.query.halaman, 10) || 1);
  const batas = Math.min(100, Math.max(1, Number.parseInt(req.query.batas, 10) || 10));
  const total = hasil.length;
  const mulai = (halaman - 1) * batas;

  res.json({
    data: hasil.slice(mulai, mulai + batas),
    meta: { halaman, batas, total, totalHalaman: Math.max(1, Math.ceil(total / batas)) },
  });
}

export function detail(req, res) {
  const item = store.cariId(ambilId(req));
  if (!item) throw tidakDitemukan("Produk tidak ditemukan");
  res.json({ data: item });
}

export function buat(req, res) {
  const { data, detail } = validasiProduk(req.body, { penuh: true });
  if (detail.length) throw validasiGagal(detail);
  const baru = store.tambah(data);
  res.status(201).location(`/api/v1/produk/${baru.id}`).json({ data: baru });
}

export function ganti(req, res) {
  const id = ambilId(req);
  if (!store.cariId(id)) throw tidakDitemukan("Produk tidak ditemukan");
  const { data, detail } = validasiProduk(req.body, { penuh: true });
  if (detail.length) throw validasiGagal(detail);
  res.json({ data: store.ganti(id, data) });
}

export function ubah(req, res) {
  const id = ambilId(req);
  if (!store.cariId(id)) throw tidakDitemukan("Produk tidak ditemukan");
  const { data, detail } = validasiProduk(req.body, { penuh: false });
  if (detail.length) throw validasiGagal(detail);
  if (Object.keys(data).length === 0) {
    throw validasiGagal([{ field: "_body", pesan: "Sertakan minimal satu field yang diubah" }]);
  }
  res.json({ data: store.ubah(id, data) });
}

export function hapus(req, res) {
  const id = ambilId(req);
  if (!store.hapus(id)) throw tidakDitemukan("Produk tidak ditemukan");
  res.status(204).end();
}
