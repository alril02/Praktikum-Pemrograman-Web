// KUNCI JAWABAN DOSEN - salin ke src/controllers/pesanan.controller.js
import * as repo from "../repositories/pesanan.repo.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";

export async function daftar(req, res) {
  const filter = req.user.peran === "admin" ? {} : { penggunaId: req.user.id };
  const data = await repo.daftar(filter);
  res.json({ data, meta: { total: data.length } });
}

export async function detail(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    throw new HttpError(400, "ID_TIDAK_VALID", "ID harus berupa bilangan bulat positif");
  }
  const pesanan = await repo.cariId(Number(req.params.id));
  const berhak = pesanan && (req.user.peran === "admin" || pesanan.pengguna.id === req.user.id);
  if (!berhak) throw tidakDitemukan("Pesanan tidak ditemukan"); // 404 sama untuk "tidak ada" dan "bukan milik Anda"
  res.json({ data: pesanan });
}

function validasiItem(body) {
  const detail = [];
  const item = body?.item;
  if (!Array.isArray(item) || item.length === 0) {
    detail.push({ field: "item", pesan: "Harus berupa array dengan minimal satu item" });
    return detail;
  }
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
  return detail;
}

export async function buat(req, res) {
  const detail = validasiItem(req.body);
  if (detail.length) throw validasiGagal(detail);

  const pesanan = await repo.buatPesanan({
    penggunaId: req.user.id, // identitas dari token, BUKAN dari body
    item: req.body.item.map((it) => ({ produkId: it.produkId, jumlah: it.jumlah })),
  });
  res.status(201).location(`/api/v1/pesanan/${pesanan.id}`).json({ data: pesanan });
}
