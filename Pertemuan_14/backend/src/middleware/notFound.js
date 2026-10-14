import { HttpError } from "../utils/httpError.js";

export function notFound(req, res, next) {
  next(new HttpError(404, "RUTE_TIDAK_DITEMUKAN", `Rute ${req.method} ${req.originalUrl} tidak ditemukan`));
}
