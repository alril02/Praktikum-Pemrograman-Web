// KUNCI JAWABAN DOSEN - salin ke src/controllers/pembayaran.controller.js
import { prisma } from "../lib/prisma.js";
import { buatCharge } from "../services/gateway.client.js";
import { HttpError, tidakDitemukan } from "../utils/httpError.js";
import { STATUS } from "../domain/pesanan.status.js";

export async function bayar(req, res) {
  if (!/^\d+$/.test(req.params.id)) {
    throw new HttpError(400, "ID_TIDAK_VALID", "ID harus berupa bilangan bulat positif");
  }
  const id = Number(req.params.id);

  const pesanan = await prisma.pesanan.findUnique({ where: { id } });
  const berhak = pesanan && (req.user.peran === "admin" || pesanan.penggunaId === req.user.id);
  if (!berhak) throw tidakDitemukan("Pesanan tidak ditemukan");

  if (pesanan.status !== STATUS.MENUNGGU) {
    throw new HttpError(409, "PESANAN_TIDAK_DAPAT_DIBAYAR", "Pesanan tidak dalam status menunggu pembayaran");
  }

  // Idempoten: tagihan sudah pernah dibuat
  if (pesanan.pembayaranId && pesanan.paymentUrl) {
    return res.json({
      data: { chargeId: pesanan.pembayaranId, paymentUrl: pesanan.paymentUrl, status: pesanan.status },
    });
  }

  const charge = await buatCharge({ pesananId: pesanan.id, jumlah: pesanan.total });

  await prisma.pesanan.update({
    where: { id },
    data: { pembayaranId: charge.id, paymentUrl: charge.payment_url },
  });

  res.json({ data: { chargeId: charge.id, paymentUrl: charge.payment_url, status: STATUS.MENUNGGU } });
}
