import { prisma } from "../lib/prisma.js";
import { STATUS, statusDariEvent, putuskanTransisi } from "../domain/pesanan.status.js";

// Memproses SATU peristiwa webhook yang sudah terverifikasi dan tervalidasi bentuknya.
// event: { id, type, created, data: { charge_id, order_ref, amount, status } }
//
// Mengembalikan { hasil: string } dengan nilai:
//   "diterapkan" | "diabaikan" | "duplikat" | "pesanan_tidak_ada" | "charge_tidak_cocok"
//   | "jumlah_tidak_cocok" | "rekonsiliasi" | "konflik"
//
// TODO (semua dalam SATU prisma.$transaction(async (tx) => { ... })):
//  1. DEDUPE: tx.eventWebhook.create({ data: { id: event.id, jenis: event.type } })
//     bila galat dengan code "P2002" -> return { hasil: "duplikat" }  (selain itu lempar ulang)
//  2. pesanan = tx.pesanan.findUnique({ where: { id: Number(event.data.order_ref) }, include: { item: true } })
//     tidak ada -> { hasil: "pesanan_tidak_ada" }
//  3. pesanan.pembayaranId !== event.data.charge_id -> { hasil: "charge_tidak_cocok" }
//  4. event.data.amount !== pesanan.total           -> { hasil: "jumlah_tidak_cocok" }  (JANGAN ubah status)
//  5. target = statusDariEvent(event.type); keputusan = putuskanTransisi(pesanan.status, target)
//     "abaikan"      -> { hasil: "diabaikan" }
//     "rekonsiliasi" -> tulis catatan pada pesanan (mis. `Peristiwa ${event.type} diterima saat status ${pesanan.status}`)
//                       lalu { hasil: "rekonsiliasi" }
//     "terapkan"     -> a. tx.pesanan.updateMany({ where: { id, status: pesanan.status }, data: { status: target,
//                              dibayarPada: target === "dibayar" ? new Date() : undefined } })
//                          count === 0 -> { hasil: "konflik" }   (diubah proses lain; penyedia akan mencoba lagi)
//                       b. bila target "kedaluwarsa" atau "gagal": kembalikan stok tiap item
//                          (tx.produk.update ... { stok: { increment: jumlah } })
//                       c. { hasil: "diterapkan" }
export async function prosesWebhook(event) {
  void [prisma, STATUS, statusDariEvent, putuskanTransisi, event];
  return { hasil: "diabaikan" };
}
