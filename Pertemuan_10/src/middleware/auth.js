import { HttpError } from "../utils/httpError.js";
import { verifikasiToken } from "../services/auth.service.js";

// TODO 1: autentikasi.
//   - ambil header Authorization; harus berbentuk "Bearer <token>"
//   - tidak ada / bentuk salah -> next(new HttpError(401, "TIDAK_TERAUTENTIKASI", ...))
//   - verifikasiToken(token); gagal (tanda tangan, kedaluwarsa, iss/aud) -> 401 "TOKEN_TIDAK_VALID"
//   - sukses -> req.user = { id: Number(payload.sub), peran: payload.peran }; next()
export function autentikasi(req, res, next) {
  next(new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "autentikasi belum diimplementasikan"));
}

// TODO 2: otorisasi(...perans) -> middleware
//   - req.user.peran termasuk perans -> next()
//   - selain itu -> next(new HttpError(403, "DILARANG", ...))
//   Catatan: harus dipasang SETELAH autentikasi.
export function otorisasi(...perans) {
  return (req, res, next) => {
    next(new HttpError(501, "BELUM_DIIMPLEMENTASIKAN", "otorisasi belum diimplementasikan"));
  };
}
