import { prisma } from "../lib/prisma.js";
import { invalidasiProduk } from "../lib/cache.js";
import { HttpError } from "../utils/httpError.js";

function bentukPesanan({ id, status, total, dibuatPada, dibayarPada, pembayaranId, paymentUrl, catatan, pengguna, item }) {
  return {
    id,
    status,
    total,
    dibuatPada,
    dibayarPada: dibayarPada ?? null,
    pembayaran: pembayaranId ? { chargeId: pembayaranId, paymentUrl: paymentUrl ?? null } : null,
    catatan: catatan ?? null,
    pengguna: { id: pengguna.id, nama: pengguna.nama, email: pengguna.email },
    item: item.map((it) => ({
      produkId: it.produkId,
      namaProduk: it.namaProduk,
      jumlah: it.jumlah,
      hargaSatuan: it.hargaSatuan,
    })),
  };
}

const sertakanLengkap = {
  pengguna: { select: { id: true, nama: true, email: true } },
  item: { include: { produk: { select: { nama: true } } } },
};

function dariPrisma(p) {
  return bentukPesanan({ ...p, item: p.item.map((it) => ({ ...it, namaProduk: it.produk.nama })) });
}

export async function daftar({ penggunaId } = {}) {
  const pesanan = await prisma.pesanan.findMany({
    where: penggunaId ? { penggunaId } : undefined,
    orderBy: { id: "asc" },
    include: sertakanLengkap,
  });
  return pesanan.map(dariPrisma);
}

export async function cariId(id) {
  const p = await prisma.pesanan.findUnique({ where: { id }, include: sertakanLengkap });
  return p ? dariPrisma(p) : undefined;
}

export async function buatPesanan({ penggunaId, item }) {
  const hasil = await prisma.$transaction(async (tx) => {
    const pengguna = await tx.pengguna.findUnique({ where: { id: penggunaId } });
    if (!pengguna) throw new HttpError(401, "PENGGUNA_TIDAK_ADA", "Akun tidak lagi tersedia");

    let total = 0;
    const baris = [];

    for (const it of item) {
      const produk = await tx.produk.findUnique({ where: { id: it.produkId } });
      if (!produk) throw new HttpError(422, "PRODUK_TIDAK_ADA", `Produk ${it.produkId} tidak ditemukan`);

      const upd = await tx.produk.updateMany({
        where: { id: produk.id, stok: { gte: it.jumlah } },
        data: { stok: { decrement: it.jumlah } },
      });
      if (upd.count === 0) throw new HttpError(409, "STOK_TIDAK_CUKUP", `Stok ${produk.nama} tidak mencukupi`);

      total += produk.harga * it.jumlah;
      baris.push({ produkId: produk.id, jumlah: it.jumlah, hargaSatuan: produk.harga });
    }

    const baru = await tx.pesanan.create({
      data: { penggunaId, total, item: { create: baris } },
      include: sertakanLengkap,
    });
    return dariPrisma(baru);
  });

  invalidasiProduk(); // stok berubah -> daftar produk di cache basi
  return hasil;
}
