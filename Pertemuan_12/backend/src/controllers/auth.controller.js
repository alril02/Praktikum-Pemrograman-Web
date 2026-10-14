// KUNCI JAWABAN DOSEN - salin ke src/controllers/auth.controller.js
import * as repo from "../repositories/pengguna.repo.js";
import { HttpError, validasiGagal } from "../utils/httpError.js";
import {
  hashSandi,
  verifikasiSandi,
  buatToken,
  periksaKebijakanSandi,
} from "../services/auth.service.js";
import { config } from "../config.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function daftar(req, res) {
  const { nama, email, password } = req.body ?? {}; // whitelist: field lain (mis. "peran") diabaikan
  const detail = [];

  const namaBersih = typeof nama === "string" ? nama.trim() : "";
  if (namaBersih.length < 2 || namaBersih.length > 100) {
    detail.push({ field: "nama", pesan: "Harus teks 2-100 karakter" });
  }

  const emailBersih = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(emailBersih) || emailBersih.length > 254) {
    detail.push({ field: "email", pesan: "Format email tidak valid" });
  }

  const galatSandi = periksaKebijakanSandi(password);
  if (galatSandi) detail.push({ field: "password", pesan: galatSandi });

  if (detail.length) throw validasiGagal(detail);

  if (await repo.cariEmailDenganHash(emailBersih)) {
    throw new HttpError(409, "EMAIL_SUDAH_TERDAFTAR", "Email sudah terdaftar");
  }

  const passwordHash = await hashSandi(password);
  const baru = await repo.buat({ nama: namaBersih, email: emailBersih, passwordHash });
  res.status(201).json({ data: repo.bentukPublik(baru) });
}

export async function masuk(req, res) {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw validasiGagal([{ field: "email/password", pesan: "Email dan kata sandi wajib diisi" }]);
  }

  const pengguna = await repo.cariEmailDenganHash(email.trim().toLowerCase());
  const sah = await verifikasiSandi(password, pengguna?.passwordHash);

  if (!pengguna || !sah) {
    throw new HttpError(401, "KREDENSIAL_SALAH", "Email atau kata sandi salah");
  }

  res.json({
    data: {
      token: buatToken(pengguna),
      tipe: "Bearer",
      kedaluwarsa: config.jwtTtl,
      pengguna: repo.bentukPublik(pengguna),
    },
  });
}

export async function saya(req, res) {
  const pengguna = await repo.cariId(req.user.id);
  if (!pengguna) throw new HttpError(401, "TOKEN_TIDAK_VALID", "Akun tidak lagi tersedia");
  res.json({ data: pengguna });
}
