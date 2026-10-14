import { createHmac, timingSafeEqual } from "node:crypto";

// Format header:  X-Signature: t=<unix detik>,v1=<hex HMAC-SHA256 dari `${t}.${rawBody}`>

// Pembantu (sudah jadi): membuat header tanda tangan. Dipakai tes dan mock gateway.
export function tandatangani(rawBody, rahasia, t = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", rahasia).update(`${t}.`).update(rawBody).digest("hex");
  return `t=${t},v1=${v1}`;
}

// TODO: verifikasi header tanda tangan terhadap BODY MENTAH (Buffer atau string).
//   Kembalikan true hanya bila SEMUA terpenuhi:
//   1. header string, dapat diurai menjadi bagian `t` (bilangan bulat) dan `v1` (hex)
//   2. |sekarang/1000 - t| <= toleransiDetik        (cegah replay)
//   3. HMAC-SHA256(rahasia, `${t}.` + rawBody) sama dengan v1 -> bandingkan dengan
//      crypto.timingSafeEqual (pastikan panjang buffer SAMA lebih dulu, jangan melempar galat)
//   Header rusak / v1 bukan hex / bagian hilang -> false (JANGAN melempar galat).
export function verifikasiTandaTangan(rawBody, header, rahasia, { toleransiDetik = 300, sekarang = Date.now() } = {}) {
  void [createHmac, timingSafeEqual, rawBody, header, rahasia, toleransiDetik, sekarang];
  return false;
}
