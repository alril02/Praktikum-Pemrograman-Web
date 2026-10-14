import { prisma } from "../lib/prisma.js";
import { kirimEmail } from "../lib/emailFake.js";
import { JobGagalPermanen } from "./queue.js";
import { cache } from "../lib/cache.js";

// Setiap handler: async (payload, job) => hasil (boleh object). Melempar galat -> retry/DLQ.
// WAJIB IDEMPOTEN: boleh dijalankan lebih dari sekali tanpa efek ganda.

// TODO 1: kirim_email_konfirmasi  payload: { pesananId }
//   - pesanan = prisma.pesanan.findUnique({ where: { id: pesananId }, include: { pengguna: true } })
//     tidak ada -> JobGagalPermanen("Pesanan tidak ditemukan")
//   - sudah ada Notifikasi unik (pesananId, jenis "email_konfirmasi") -> return { dilewati: true }  (idempoten)
//   - await kirimEmail({ to: pesanan.pengguna.email, subjek: `Pembayaran pesanan #${id} diterima`, percobaan: job.percobaan })
//   - prisma.notifikasi.upsert pada kunci unik (pesananId_jenis) -> simpan penerima, subjek
//   - return { terkirim: true }
async function kirimEmailKonfirmasi(payload, job) {
  void [prisma, kirimEmail, JobGagalPermanen, payload, job];
  throw new JobGagalPermanen("Handler kirim_email_konfirmasi belum diimplementasikan");
}

// TODO 2: buat_invoice  payload: { pesananId }
//   - pesanan tidak ada -> JobGagalPermanen
//   - nomor = `INV-${tahunDariDibayarPada}-${String(pesananId).padStart(6, "0")}`   (deterministik -> idempoten)
//   - prisma.invoice.upsert({ where: { pesananId }, update: {}, create: { pesananId, nomor, total: pesanan.total } })
//   - return { nomor }
async function buatInvoice(payload) {
  void [prisma, payload];
  throw new JobGagalPermanen("Handler buat_invoice belum diimplementasikan");
}

// TODO 3 (opsional/pengayaan): kedaluwarsakan_pesanan_lama  payload: { batasMenit }
//   - cari pesanan status "menunggu_pembayaran" dengan dibuatPada < sekarang - batasMenit
//   - untuk tiap pesanan, dalam transaksi: updateMany({ where: { id, status: "menunggu_pembayaran" },
//       data: { status: "kedaluwarsa" } }); bila count 1 -> kembalikan stok tiap item (increment)
//   - setelah selesai: cache.hapusAwalan("produk:")
//   - return { jumlah }
async function kedaluwarsakanPesananLama(payload) {
  void [prisma, cache, payload];
  return { jumlah: 0 };
}

export const handlers = {
  kirim_email_konfirmasi: kirimEmailKonfirmasi,
  buat_invoice: buatInvoice,
  kedaluwarsakan_pesanan_lama: kedaluwarsakanPesananLama,
};
