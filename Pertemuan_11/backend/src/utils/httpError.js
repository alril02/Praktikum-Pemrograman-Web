export class HttpError extends Error {
  constructor(status, kode, pesan, detail) {
    super(pesan);
    this.name = "HttpError";
    this.status = status;
    this.kode = kode;
    this.detail = detail;
  }
}

export const tidakDitemukan = (pesan = "Resource tidak ditemukan") =>
  new HttpError(404, "TIDAK_DITEMUKAN", pesan);

export const validasiGagal = (detail) =>
  new HttpError(422, "VALIDASI", "Data tidak valid", detail);
