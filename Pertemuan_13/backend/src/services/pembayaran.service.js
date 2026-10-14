import { prisma } from "../lib/prisma.js";
import { statusDariEvent, putuskanTransisi } from "../domain/pesanan.status.js";
import { enqueue } from "../queue/queue.js";
import { invalidasiProduk } from "../lib/cache.js";

// Versi pertemuan 12 + OUTBOX: job dicatat dalam transaksi yang sama dengan perubahan status.
export async function prosesWebhook(event) {
  const hasil = await prisma.$transaction(async (tx) => {
    // 1. Dedupe atomik berdasarkan ID peristiwa
    try {
      await tx.eventWebhook.create({ data: { id: event.id, jenis: event.type } });
    } catch (e) {
      if (e?.code === "P2002") return { hasil: "duplikat" };
      throw e;
    }

    const id = Number(event.data.order_ref);
    const pesanan = Number.isInteger(id)
      ? await tx.pesanan.findUnique({ where: { id }, include: { item: true } })
      : null;
    if (!pesanan) return { hasil: "pesanan_tidak_ada" };
    if (pesanan.pembayaranId !== event.data.charge_id) return { hasil: "charge_tidak_cocok" };
    if (event.data.amount !== pesanan.total) return { hasil: "jumlah_tidak_cocok" };

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

    // TODO (OUTBOX): bila target === "dibayar", catat DUA job dalam transaksi ini (variabel `tx`!):
    //   await enqueue(tx, { jenis: "kirim_email_konfirmasi", payload: { pesananId: id }, kunciUnik: `email:${id}` });
    //   await enqueue(tx, { jenis: "buat_invoice",           payload: { pesananId: id }, kunciUnik: `invoice:${id}` });
    //   (kunciUnik membuat enqueue ganda aman; job HANYA ada bila perubahan status ikut ter-commit)
    void enqueue;

    return { hasil: "diterapkan", target };
  });

  if (hasil.hasil === "diterapkan" && (hasil.target === "kedaluwarsa" || hasil.target === "gagal")) {
    invalidasiProduk(); // stok dikembalikan -> cache daftar produk basi
  }
  return hasil;
}
