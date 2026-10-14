// KUNCI JAWABAN DOSEN - salin ke src/services/pembayaran.service.js
import { prisma } from "../lib/prisma.js";
import { statusDariEvent, putuskanTransisi } from "../domain/pesanan.status.js";

export async function prosesWebhook(event) {
  return prisma.$transaction(async (tx) => {
    // 1. Dedupe atomik berdasarkan ID peristiwa (PRIMARY KEY = UNIQUE)
    try {
      await tx.eventWebhook.create({ data: { id: event.id, jenis: event.type } });
    } catch (e) {
      if (e?.code === "P2002") return { hasil: "duplikat" };
      throw e;
    }

    // 2-4. Korelasi dan validasi terhadap data lokal
    const id = Number(event.data.order_ref);
    const pesanan = Number.isInteger(id)
      ? await tx.pesanan.findUnique({ where: { id }, include: { item: true } })
      : null;
    if (!pesanan) return { hasil: "pesanan_tidak_ada" };
    if (pesanan.pembayaranId !== event.data.charge_id) return { hasil: "charge_tidak_cocok" };
    if (event.data.amount !== pesanan.total) return { hasil: "jumlah_tidak_cocok" };

    // 5. State machine
    const target = statusDariEvent(event.type);
    const keputusan = putuskanTransisi(pesanan.status, target);

    if (keputusan === "abaikan") return { hasil: "diabaikan" };

    if (keputusan === "rekonsiliasi") {
      await tx.pesanan.update({
        where: { id },
        data: { catatan: `Perlu rekonsiliasi: peristiwa ${event.type} (${event.id}) saat status ${pesanan.status}` },
      });
      return { hasil: "rekonsiliasi" };
    }

    // "terapkan": pembaruan bersyarat pada status lama (cegah balapan antar-proses)
    const diubah = await tx.pesanan.updateMany({
      where: { id, status: pesanan.status },
      data: { status: target, ...(target === "dibayar" ? { dibayarPada: new Date() } : {}) },
    });
    if (diubah.count === 0) return { hasil: "konflik" };

    if (target === "kedaluwarsa" || target === "gagal") {
      for (const it of pesanan.item) {
        await tx.produk.update({ where: { id: it.produkId }, data: { stok: { increment: it.jumlah } } });
      }
    }
    return { hasil: "diterapkan" };
  });
}
