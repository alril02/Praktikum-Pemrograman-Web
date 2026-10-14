import { prisma } from "../lib/prisma.js";
import { buatCharge } from "../services/gateway.client.js";
import { HttpError, tidakDitemukan } from "../utils/httpError.js";
import { STATUS } from "../domain/pesanan.status.js";

// POST /api/v1/pesanan/:id/bayar   (pemilik pesanan atau admin)
//
// TODO (urut):
//  1. id harus /^\d+$/ -> 400 ID_TIDAK_VALID
//  2. pesanan = prisma.pesanan.findUnique; tidak ada ATAU bukan milik req.user (dan bukan admin) -> tidakDitemukan (404)
//  3. status !== STATUS.MENUNGGU -> HttpError(409, "PESANAN_TIDAK_DAPAT_DIBAYAR", "Pesanan tidak dalam status menunggu pembayaran")
//  4. IDEMPOTEN: bila pesanan.pembayaranId dan pesanan.paymentUrl sudah ada -> kembalikan yang ada (tanpa memanggil gateway)
//  5. charge = await buatCharge({ pesananId: pesanan.id, jumlah: pesanan.total })
//  6. simpan pembayaranId = charge.id dan paymentUrl = charge.payment_url
//  7. res.json({ data: { chargeId, paymentUrl, status: "menunggu_pembayaran" } })
export async function bayar(req, res) {
  void [prisma, buatCharge, tidakDitemukan, STATUS];
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "Pembayaran belum diimplementasikan");
}
