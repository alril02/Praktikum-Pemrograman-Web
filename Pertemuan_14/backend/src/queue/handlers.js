// KUNCI JAWABAN DOSEN - salin ke src/queue/handlers.js
import { prisma } from "../lib/prisma.js";
import { kirimEmail } from "../lib/emailFake.js";
import { JobGagalPermanen } from "./queue.js";
import { cache } from "../lib/cache.js";

const JENIS_EMAIL = "email_konfirmasi";

async function kirimEmailKonfirmasi({ pesananId }, job) {
  const pesanan = await prisma.pesanan.findUnique({ where: { id: pesananId }, include: { pengguna: true } });
  if (!pesanan) throw new JobGagalPermanen(`Pesanan ${pesananId} tidak ditemukan`);

  const sudah = await prisma.notifikasi.findUnique({
    where: { pesananId_jenis: { pesananId, jenis: JENIS_EMAIL } },
  });
  if (sudah) return { dilewati: true };

  const subjek = `Pembayaran pesanan #${pesananId} diterima`;
  await kirimEmail({ to: pesanan.pengguna.email, subjek, percobaan: job?.percobaan ?? 1 });

  await prisma.notifikasi.upsert({
    where: { pesananId_jenis: { pesananId, jenis: JENIS_EMAIL } },
    update: {},
    create: { pesananId, jenis: JENIS_EMAIL, penerima: pesanan.pengguna.email, subjek },
  });
  return { terkirim: true };
}

async function buatInvoice({ pesananId }) {
  const pesanan = await prisma.pesanan.findUnique({ where: { id: pesananId } });
  if (!pesanan) throw new JobGagalPermanen(`Pesanan ${pesananId} tidak ditemukan`);

  const tahun = (pesanan.dibayarPada ?? pesanan.dibuatPada).getUTCFullYear();
  const nomor = `INV-${tahun}-${String(pesananId).padStart(6, "0")}`;

  await prisma.invoice.upsert({
    where: { pesananId },
    update: {},
    create: { pesananId, nomor, total: pesanan.total },
  });
  return { nomor };
}

async function kedaluwarsakanPesananLama({ batasMenit = 60 } = {}) {
  const batas = new Date(Date.now() - batasMenit * 60_000);
  const kandidat = await prisma.pesanan.findMany({
    where: { status: "menunggu_pembayaran", dibuatPada: { lt: batas } },
    include: { item: true },
  });

  let jumlah = 0;
  for (const p of kandidat) {
    const diubah = await prisma.$transaction(async (tx) => {
      const u = await tx.pesanan.updateMany({
        where: { id: p.id, status: "menunggu_pembayaran" },
        data: { status: "kedaluwarsa" },
      });
      if (u.count === 0) return false;
      for (const it of p.item) {
        await tx.produk.update({ where: { id: it.produkId }, data: { stok: { increment: it.jumlah } } });
      }
      return true;
    });
    if (diubah) jumlah++;
  }

  if (jumlah > 0) cache.hapusAwalan("produk:");
  return { jumlah };
}

export const handlers = {
  kirim_email_konfirmasi: kirimEmailKonfirmasi,
  buat_invoice: buatInvoice,
  kedaluwarsakan_pesanan_lama: kedaluwarsakanPesananLama,
};
