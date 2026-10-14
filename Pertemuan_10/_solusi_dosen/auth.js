// KUNCI JAWABAN DOSEN - salin ke src/middleware/auth.js
import { HttpError } from "../utils/httpError.js";
import { verifikasiToken } from "../services/auth.service.js";

export function autentikasi(req, res, next) {
  const header = req.get("Authorization") ?? "";
  const [skema, token] = header.split(" ");

  if (skema !== "Bearer" || !token) {
    return next(new HttpError(401, "TIDAK_TERAUTENTIKASI", "Token autentikasi tidak ada"));
  }

  try {
    const payload = verifikasiToken(token);
    req.user = { id: Number(payload.sub), peran: payload.peran };
    next();
  } catch {
    next(new HttpError(401, "TOKEN_TIDAK_VALID", "Token tidak valid atau sudah kedaluwarsa"));
  }
}

export function otorisasi(...perans) {
  return (req, res, next) => {
    if (req.user && perans.includes(req.user.peran)) return next();
    next(new HttpError(403, "DILARANG", "Anda tidak berhak mengakses sumber daya ini"));
  };
}
