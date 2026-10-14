import { HttpError } from "../utils/httpError.js";

// TODO 2: dipanggil bila tidak ada route yang cocok.
//   Teruskan HttpError 404 dengan kode "RUTE_TIDAK_DITEMUKAN" ke errorHandler (next(err)).
export function notFound(req, res, next) {
  next();
}
