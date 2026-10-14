// KUNCI JAWABAN DOSEN - salin ke src/services/auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

const HASH_TIRUAN = bcrypt.hashSync("kata-sandi-tiruan-agar-waktu-konstan", config.bcryptCost);

export async function hashSandi(sandi) {
  return bcrypt.hash(sandi, config.bcryptCost);
}

export async function verifikasiSandi(sandi, hash) {
  const cocok = await bcrypt.compare(sandi, hash ?? HASH_TIRUAN);
  return Boolean(hash) && cocok;
}

export function buatToken(pengguna) {
  return jwt.sign({ peran: pengguna.peran }, config.jwtSecret, {
    algorithm: "HS256",
    subject: String(pengguna.id),
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    expiresIn: config.jwtTtl,
  });
}

export function verifikasiToken(token) {
  return jwt.verify(token, config.jwtSecret, {
    algorithms: ["HS256"],
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  });
}

export function periksaKebijakanSandi(sandi) {
  if (typeof sandi !== "string") return "Kata sandi wajib berupa teks";
  if (sandi.length < 10) return "Kata sandi minimal 10 karakter";
  if (Buffer.byteLength(sandi, "utf8") > 72) return "Kata sandi maksimal 72 byte (batas bcrypt)";
  return null;
}
