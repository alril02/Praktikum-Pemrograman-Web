// KUNCI JAWABAN DOSEN - salin ke src/repositories/pesanan.repo.js
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../utils/httpError.js";

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

const sertakanLengkap = {
  pengguna: true,
  item: { include: { produk: { select: { nama: true } } } },
};

function dariPrisma(p) {
  return bentukPesanan({
    ...p,
    item: p.item.map((it) => ({ ...it, namaProduk: it.produk.nama })),
  });
}

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

export async function daftarBaik() {
  const pesanan = await prisma.pesanan.findMany({ orderBy: { id: "asc" }, include: sertakanLengkap });
  return pesanan.map(dariPrisma);
}

export async function cariId(id) {
  const p = await prisma.pesanan.findUnique({ where: { id }, include: sertakanLengkap });
  return p ? dariPrisma(p) : undefined;
}

export async function buatPesanan({ penggunaId, item }) {
  return prisma.$transaction(async (tx) => {
    const pengguna = await tx.pengguna.findUnique({ where: { id: penggunaId } });
    if (!pengguna) {
      throw new HttpError(422, "PENGGUNA_TIDAK_ADA", "Pengguna tidak ditemukan", [
        { field: "penggunaId", pesan: "Pengguna tidak ada" },
      ]);
    }

    let total = 0;
    const baris = [];

    for (const it of item) {
      const produk = await tx.produk.findUnique({ where: { id: it.produkId } });
      if (!produk) {
        throw new HttpError(422, "PRODUK_TIDAK_ADA", `Produk ${it.produkId} tidak ditemukan`);
      }

      // Penjaga stok ATOMIK: hanya berhasil bila stok masih cukup
      const hasil = await tx.produk.updateMany({
        where: { id: produk.id, stok: { gte: it.jumlah } },
        data: { stok: { decrement: it.jumlah } },
      });
      if (hasil.count === 0) {
        throw new HttpError(409, "STOK_TIDAK_CUKUP", `Stok ${produk.nama} tidak mencukupi`);
      }

      total += produk.harga * it.jumlah;
      baris.push({ produkId: produk.id, jumlah: it.jumlah, hargaSatuan: produk.harga });
    }

    const baru = await tx.pesanan.create({
      data: { penggunaId, total, item: { create: baris } },
      include: sertakanLengkap,
    });
    return dariPrisma(baru);
  });
}
