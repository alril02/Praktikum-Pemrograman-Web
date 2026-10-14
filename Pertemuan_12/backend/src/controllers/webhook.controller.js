import { config } from "../config.js";
import { verifikasiTandaTangan } from "../utils/signature.js";
import { prosesWebhook } from "../services/pembayaran.service.js";
import { HttpError } from "../utils/httpError.js";

function bentukEventValid(e) {
  return (
    e &&
    typeof e === "object" &&
    typeof e.id === "string" && e.id.length > 0 &&
    typeof e.type === "string" &&
    e.data && typeof e.data === "object" &&
    typeof e.data.charge_id === "string" &&
    typeof e.data.order_ref === "string" &&
    Number.isInteger(e.data.amount)
  );
}

// POST /api/v1/webhook/gateway
// Rute ini dipasang dengan express.raw() => req.body adalah BUFFER (byte asli untuk HMAC).
//
// TODO (urut):
//  1. Buffer.isBuffer(req.body) harus true, selain itu HttpError(400, "BODY_TIDAK_VALID", ...)
//  2. verifikasiTandaTangan(req.body, req.get("X-Signature") ?? "", config.gatewayWebhookSecret,
//        { toleransiDetik: config.toleransiWebhookDetik })   -> false: HttpError(401, "TANDA_TANGAN_TIDAK_VALID", ...)
//     (verifikasi SEBELUM mengurai JSON atau menyentuh database)
//  3. JSON.parse(req.body.toString("utf8")) -> gagal: 400 "JSON_RUSAK"; bentuk salah (bentukEventValid): 400 "EVENT_TIDAK_VALID"
//  4. hasil = await prosesWebhook(event)
//  5. hasil.hasil === "konflik" -> HttpError(409, ...) agar penyedia mencoba lagi
//  6. selain itu: res.status(200).json({ status: hasil.hasil })   (balas CEPAT)
export async function terima(req, res) {
  void [config, verifikasiTandaTangan, prosesWebhook, bentukEventValid];
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "Webhook belum diimplementasikan");
}
