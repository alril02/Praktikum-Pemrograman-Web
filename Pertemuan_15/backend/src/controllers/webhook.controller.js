// KUNCI JAWABAN DOSEN - salin ke src/controllers/webhook.controller.js
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

export async function terima(req, res) {
  if (!Buffer.isBuffer(req.body)) {
    throw new HttpError(400, "BODY_TIDAK_VALID", "Body harus berupa application/json");
  }

  const sah = verifikasiTandaTangan(req.body, req.get("X-Signature") ?? "", config.gatewayWebhookSecret, {
    toleransiDetik: config.toleransiWebhookDetik,
  });
  if (!sah) {
    throw new HttpError(401, "TANDA_TANGAN_TIDAK_VALID", "Tanda tangan webhook tidak valid");
  }

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    throw new HttpError(400, "JSON_RUSAK", "Body bukan JSON yang valid");
  }
  if (!bentukEventValid(event)) {
    throw new HttpError(400, "EVENT_TIDAK_VALID", "Bentuk peristiwa tidak dikenali");
  }

  const hasil = await prosesWebhook(event);
  if (hasil.hasil === "konflik") {
    throw new HttpError(409, "KONFLIK_STATUS", "Status berubah bersamaan; coba lagi");
  }

  console.log(`[webhook] ${event.id} ${event.type} -> ${hasil.hasil}`);
  res.status(200).json({ status: hasil.hasil });
}
