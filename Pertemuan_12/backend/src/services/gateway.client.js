// Klien payment gateway: SATU-SATUNYA tempat yang berbicara dengan vendor.
import { config } from "../config.js";
import { HttpError } from "../utils/httpError.js";

// TODO: buat tagihan.   POST {gatewayBaseUrl}/v1/charges
//   - headers: Authorization: Bearer <gatewayApiKey>, Content-Type: application/json,
//              Idempotency-Key: `pesanan-${pesananId}`   (retry TIDAK membuat tagihan ganda)
//   - body   : { amount: jumlah, order_ref: String(pesananId) }
//   - signal : AbortSignal.timeout(config.gatewayTimeoutMs)
//   - galat jaringan: TimeoutError -> HttpError(504, "GATEWAY_TIMEOUT", "Gateway tidak merespons tepat waktu")
//                     lainnya      -> HttpError(502, "GATEWAY_TIDAK_TERJANGKAU", "Tidak dapat menghubungi gateway")
//   - respons !ok  : HttpError(502, "GATEWAY_ERROR", "Gateway menolak permintaan")
//                    (JANGAN meneruskan body/galat vendor ke klien; catat statusnya di log server)
//   - sukses       : kembalikan JSON { id, amount, order_ref, status, payment_url }
export async function buatCharge({ pesananId, jumlah }) {
  void [config, HttpError, pesananId, jumlah];
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "Klien gateway belum diimplementasikan");
}
