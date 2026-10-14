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

// POST /api/v1/auth/daftar  { nama, email, password }
// TODO 1:
//   - validasi: nama string 2-100; email cocok EMAIL_RE & <= 254, ubah ke huruf kecil;
//     password lolos periksaKebijakanSandi (galat -> detail field "password")
//   - IGNORE field lain (terutama "peran"): peran ditetapkan server
//   - email sudah ada -> HttpError(409, "EMAIL_SUDAH_TERDAFTAR", ...)
//   - simpan dengan hashSandi; kembalikan 201 { data: { id, nama, email, peran } }  (TANPA hash)
export async function daftar(req, res) {
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "daftar belum diimplementasikan");
}

// POST /api/v1/auth/masuk  { email, password }
// TODO 2:
//   - validasi: email dan password harus string (kosong -> 422)
//   - cari pengguna by email (huruf kecil); verifikasiSandi(password, pengguna?.passwordHash)
//   - GAGAL (email tak ada ATAU sandi salah) -> status & pesan IDENTIK:
//       HttpError(401, "KREDENSIAL_SALAH", "Email atau kata sandi salah")
//   - sukses -> 200 { data: { token, tipe: "Bearer", kedaluwarsa: config.jwtTtl, pengguna: {id,nama,email,peran} } }
export async function masuk(req, res) {
  void [validasiGagal, hashSandi, verifikasiSandi, buatToken, periksaKebijakanSandi, config, EMAIL_RE, repo];
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "masuk belum diimplementasikan");
}

// GET /api/v1/auth/saya  (butuh autentikasi)
// TODO 3: ambil pengguna dari repo.cariId(req.user.id); 401 bila akun sudah tidak ada; kembalikan { data }
export async function saya(req, res) {
  throw new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "saya belum diimplementasikan");
}
