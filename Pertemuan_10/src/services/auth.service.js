import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

// Hash tiruan untuk menyamakan waktu respons ketika pengguna tidak ditemukan.
const HASH_TIRUAN = bcrypt.hashSync("kata-sandi-tiruan-agar-waktu-konstan", config.bcryptCost);

// TODO 1: hash kata sandi dengan bcrypt.hash(sandi, config.bcryptCost). Salt dibuat otomatis.
export async function hashSandi(sandi) {
  throw new Error("Belum diimplementasikan: hashSandi");
}

// TODO 2: bandingkan sandi dengan hash.
//   - bila `hash` null/undefined, TETAP jalankan bcrypt.compare terhadap HASH_TIRUAN (waktu konstan)
//     lalu kembalikan false.
//   - kembalikan boolean.
export async function verifikasiSandi(sandi, hash) {
  return false;
}

// TODO 3: buat JWT dengan jwt.sign:
//   payload  : { peran }
//   opsi     : { algorithm: "HS256", subject: String(pengguna.id), issuer, audience, expiresIn: config.jwtTtl }
export function buatToken(pengguna) {
  throw new Error("Belum diimplementasikan: buatToken");
}

// TODO 4: verifikasi token. WAJIB mem-pin algoritma: { algorithms: ["HS256"], issuer, audience }.
//   Kembalikan payload; biarkan jwt.verify melempar bila tidak valid.
export function verifikasiToken(token) {
  throw new Error("Belum diimplementasikan: verifikasiToken");
}

// Kebijakan kata sandi (NIST 800-63B: utamakan panjang).
// Mengembalikan string pesan galat atau null bila valid.
export function periksaKebijakanSandi(sandi) {
  if (typeof sandi !== "string") return "Kata sandi wajib berupa teks";
  if (sandi.length < 10) return "Kata sandi minimal 10 karakter";
  if (Buffer.byteLength(sandi, "utf8") > 72) return "Kata sandi maksimal 72 byte (batas bcrypt)";
  return null;
}
