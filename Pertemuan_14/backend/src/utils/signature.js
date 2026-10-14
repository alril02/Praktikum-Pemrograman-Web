// KUNCI JAWABAN DOSEN - salin ke src/utils/signature.js
import { createHmac, timingSafeEqual } from "node:crypto";

export function tandatangani(rawBody, rahasia, t = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", rahasia).update(`${t}.`).update(rawBody).digest("hex");
  return `t=${t},v1=${v1}`;
}

export function verifikasiTandaTangan(rawBody, header, rahasia, { toleransiDetik = 300, sekarang = Date.now() } = {}) {
  if (typeof header !== "string" || header.length === 0 || typeof rahasia !== "string") return false;

  const bagian = {};
  for (const potong of header.split(",")) {
    const i = potong.indexOf("=");
    if (i > 0) bagian[potong.slice(0, i).trim()] = potong.slice(i + 1).trim();
  }

  if (!/^\d+$/.test(bagian.t ?? "")) return false;
  const t = Number(bagian.t);
  const v1 = bagian.v1 ?? "";
  if (!/^[0-9a-f]{64}$/i.test(v1)) return false;

  if (Math.abs(sekarang / 1000 - t) > toleransiDetik) return false;

  const harapan = createHmac("sha256", rahasia).update(`${t}.`).update(rawBody).digest();
  const diterima = Buffer.from(v1, "hex");
  return harapan.length === diterima.length && timingSafeEqual(harapan, diterima);
}
