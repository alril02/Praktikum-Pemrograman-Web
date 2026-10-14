import * as repo from "../repositories/pesanan.repo.js";
import { HttpError, tidakDitemukan, validasiGagal } from "../utils/httpError.js";

// GET /api/v1/pesanan
// TODO 1 (otorisasi data): admin melihat SEMUA pesanan; pengguna biasa HANYA miliknya
//   (repo.daftar({ penggunaId: req.user.id })).
export async function daftar(req, res) {
  const data = await repo.daftar({});
  res.json({ data, meta: { total: data.length } });
}

// GET /api/v1/pesanan/:id
// TODO 2 (cegah IDOR): hanya pemilik atau admin. Untuk pesanan milik orang lain
//   lempar tidakDitemukan(...) -> 404 (tidak membocorkan keberadaan).
export async function detail(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    throw new HttpError(400, "ID_TIDAK_VALID", "ID harus berupa bilangan bulat positif");
  }
  const pesanan = await repo.cariId(Number(req.params.id));
  if (!pesanan) throw tidakDitemukan("Pesanan tidak ditemukan");
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

// POST /api/v1/pesanan  { item: [{ produkId, jumlah }] }
// TODO 3: pemilik pesanan = req.user.id. ABAIKAN body.penggunaId (cegah pemalsuan identitas).
export async function buat(req, res) {
  const detail = validasiItem(req.body);
  if (detail.length) throw validasiGagal(detail);

  const penggunaId = req.body.penggunaId; // GANTI: gunakan req.user.id
  const pesanan = await repo.buatPesanan({
    penggunaId,
    item: req.body.item.map((it) => ({ produkId: it.produkId, jumlah: it.jumlah })),
  });
  res.status(201).location(`/api/v1/pesanan/${pesanan.id}`).json({ data: pesanan });
}
