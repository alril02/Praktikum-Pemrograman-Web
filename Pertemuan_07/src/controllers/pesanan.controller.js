import * as repo from "../repositories/pesanan.repo.js";
import { hitungKueri } from "../lib/prisma.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";

// GET /api/v1/pesanan?mode=buruk|baik   (default: baik)
// Header respons X-Jumlah-Query = banyak kueri SQL yang dijalankan untuk request ini.
export async function daftar(req, res) {
  const mode = req.query.mode === "buruk" ? "buruk" : "baik";
  const sebelum = hitungKueri();

  const data = mode === "buruk" ? await repo.daftarBuruk() : await repo.daftarBaik();

  res.set("X-Jumlah-Query", String(hitungKueri() - sebelum));
  res.json({ data, meta: { mode, total: data.length } });
}

export async function detail(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    throw new HttpError(400, "ID_TIDAK_VALID", "ID harus berupa bilangan bulat positif");
  }
  const pesanan = await repo.cariId(Number(req.params.id));
  if (!pesanan) throw tidakDitemukan("Pesanan tidak ditemukan");
  res.json({ data: pesanan });
}

function validasiPesanan(body) {
  const detail = [];
  const sumber = body && typeof body === "object" ? body : {};

  if (!Number.isInteger(sumber.penggunaId) || sumber.penggunaId < 1) {
    detail.push({ field: "penggunaId", pesan: "Harus bilangan bulat positif" });
  }

  const item = sumber.item;
  if (!Array.isArray(item) || item.length === 0) {
    detail.push({ field: "item", pesan: "Harus berupa array dengan minimal satu item" });
  } else {
    const terlihat = new Set();
    item.forEach((it, i) => {
      if (!Number.isInteger(it?.produkId) || it.produkId < 1) {
        detail.push({ field: `item[${i}].produkId`, pesan: "Harus bilangan bulat positif" });
      }
      if (!Number.isInteger(it?.jumlah) || it.jumlah < 1 || it.jumlah > 1000) {
        detail.push({ field: `item[${i}].jumlah`, pesan: "Harus bilangan bulat 1-1000" });
      }
      if (terlihat.has(it?.produkId)) {
        detail.push({ field: `item[${i}].produkId`, pesan: "Produk duplikat pada satu pesanan" });
      }
      terlihat.add(it?.produkId);
    });
  }

  return detail;
}

// POST /api/v1/pesanan  { penggunaId, item: [{ produkId, jumlah }] }
export async function buat(req, res) {
  const detail = validasiPesanan(req.body);
  if (detail.length) throw validasiGagal(detail);

  const { penggunaId, item } = req.body;
  const pesanan = await repo.buatPesanan({
    penggunaId,
    item: item.map((it) => ({ produkId: it.produkId, jumlah: it.jumlah })),
  });

  res.status(201).location(`/api/v1/pesanan/${pesanan.id}`).json({ data: pesanan });
}
