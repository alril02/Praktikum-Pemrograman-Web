// KUNCI JAWABAN DOSEN - salin ke src/services/gateway.client.js
import { config } from "../config.js";
import { HttpError } from "../utils/httpError.js";

export async function buatCharge({ pesananId, jumlah }) {
  let r;
  try {
    r = await fetch(`${config.gatewayBaseUrl}/v1/charges`, {
      method: "POST",
      signal: AbortSignal.timeout(config.gatewayTimeoutMs),
      headers: {
        Authorization: `Bearer ${config.gatewayApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `pesanan-${pesananId}`,
      },
      body: JSON.stringify({ amount: jumlah, order_ref: String(pesananId) }),
    });
  } catch (e) {
    if (e?.name === "TimeoutError") {
      throw new HttpError(504, "GATEWAY_TIMEOUT", "Gateway tidak merespons tepat waktu");
    }
    throw new HttpError(502, "GATEWAY_TIDAK_TERJANGKAU", "Tidak dapat menghubungi gateway pembayaran");
  }

  if (!r.ok) {
    console.error(`[gateway] charge ditolak: HTTP ${r.status} (pesanan ${pesananId})`);
    throw new HttpError(502, "GATEWAY_ERROR", "Gateway pembayaran menolak permintaan");
  }
  return r.json();
}
