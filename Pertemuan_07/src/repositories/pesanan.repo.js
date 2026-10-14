import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";

// Bentuk keluaran pesanan (sama untuk versi buruk maupun baik)
function bentukPesanan({ id, status, total, dibuatPada, pengguna, item }) {
  return {
    id,
    status,
    total,
    dibuatPada,
    pengguna: { id: pengguna.id, nama: pengguna.nama, email: pengguna.email },
    item: item.map((it) => ({
      produkId: it.produkId,
      namaProduk: it.namaProduk,
      jumlah: it.jumlah,
      hargaSatuan: it.hargaSatuan,
    })),
  };
}

// ---------- CONTOH BURUK (sudah jadi): pola N+1 ----------
// Untuk P pesanan dengan rata-rata I item: 1 + P + P + (P * I) kueri.
export async function daftarBuruk() {
  const pesanan = await prisma.pesanan.findMany({ orderBy: { id: "asc" } });
  const hasil = [];

  for (const p of pesanan) {
    const pengguna = await prisma.pengguna.findUnique({ where: { id: p.penggunaId } });
    const baris = await prisma.itemPesanan.findMany({ where: { pesananId: p.id } });

    const item = [];
    for (const it of baris) {
      const produk = await prisma.produk.findUnique({ where: { id: it.produkId } });
      item.push({ ...it, namaProduk: produk.nama });
    }
    hasil.push(bentukPesanan({ ...p, pengguna, item }));
  }
  return hasil;
}

// TODO 1: versi BAIK dengan eager loading. Jumlah kueri harus tetap (tidak bergantung jumlah pesanan).
//   prisma.pesanan.findMany({
//     orderBy: { id: "asc" },
//     include: { pengguna: true, item: { include: { produk: { select: { nama: true } } } } },
//   })
//   lalu petakan: item -> { ...it, namaProduk: it.produk.nama } dan gunakan bentukPesanan.
export async function daftarBaik() {
  return daftarBuruk(); // GANTI
}

// TODO 2: ambil satu pesanan lengkap (include pengguna + item.produk); undefined bila tidak ada
export async function cariId(id) {
  return undefined;
}

// TODO 3: checkout ATOMIK dengan prisma.$transaction(async (tx) => { ... })
//   Untuk setiap item:
//     a. tx.produk.findUnique -> bila tidak ada lempar HttpError(422, "PRODUK_TIDAK_ADA", ...)
//     b. tx.produk.updateMany({ where: { id, stok: { gte: jumlah } }, data: { stok: { decrement: jumlah } } })
//        bila count === 0 lempar HttpError(409, "STOK_TIDAK_CUKUP", ...)   <- penjaga stok ATOMIK
//     c. kumpulkan { produkId, jumlah, hargaSatuan: produk.harga } dan akumulasi total
//   Sebelum loop: pastikan pengguna ada (tx.pengguna.findUnique); bila tidak lempar HttpError(422, "PENGGUNA_TIDAK_ADA", ...)
//   Terakhir: tx.pesanan.create({ data: { penggunaId, total, item: { create: baris } }, include: {...} })
//   Kembalikan lewat bentukPesanan.
//   Melempar error di dalam callback otomatis me-rollback seluruh transaksi.
export async function buatPesanan({ penggunaId, item }) {
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "Checkout belum diimplementasikan");
}
