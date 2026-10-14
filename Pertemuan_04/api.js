// Lapisan akses jaringan tunggal. Semua pemanggilan fetch aplikasi melewati berkas ini.
// Pada pertemuan 11 berkas ini akan diperluas dengan token autentikasi dan interceptor.

export const API_BASE = "http://localhost:4000";

export class ApiError extends Error {
  constructor(pesan, { status = 0, jenis = "http" } = {}) {
    super(pesan);
    this.name = "ApiError";
    this.status = status;
    this.jenis = jenis; // "jaringan" | "http" | "format" | "timeout"
  }
}

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

// TODO 1: lengkapi ambilJson(path, { signal, timeoutMs })
//   - gabungkan sinyal pembatalan pemanggil dengan AbortSignal.timeout(timeoutMs) (AbortSignal.any)
//   - fetch(API_BASE + path, { headers: { Accept: "application/json" }, signal })
//   - kegagalan jaringan  -> lempar ApiError(..., { jenis: "jaringan" })
//   - timeout             -> lempar ApiError(..., { jenis: "timeout" })
//   - !respons.ok         -> lempar ApiError dengan status; baca pesan JSON server bila ada
//   - status 204          -> kembalikan null
//   - body bukan JSON     -> lempar ApiError(..., { jenis: "format" })
//   - JANGAN menelan AbortError akibat pembatalan pemanggil: lempar ulang apa adanya
export async function ambilJson(path, { signal, timeoutMs = 5000 } = {}) {
  const respons = await fetch(API_BASE + path, { signal });
  return respons.json();
}

// TODO 2: ambilDenganCobaUlang(path, opsi, { percobaan, dasarMs })
//   - ulangi HANYA untuk jenis "jaringan", "timeout", atau status 5xx / 429
//   - jeda: dasarMs * 2 ** i + acak 0-100 ms
//   - jangan ulangi bila sinyal dibatalkan (AbortError)
export async function ambilDenganCobaUlang(path, opsi = {}, { percobaan = 3, dasarMs = 300 } = {}) {
  return ambilJson(path, opsi);
}

// Pembantu: ubah ApiError menjadi pesan ramah pengguna
export function pesanUntukPengguna(err) {
  if (err instanceof ApiError) {
    if (err.jenis === "jaringan") return "Tidak dapat terhubung. Periksa koneksi internet Anda.";
    if (err.jenis === "timeout") return "Server terlalu lama merespons. Coba lagi sebentar lagi.";
    if (err.jenis === "format") return "Data dari server tidak dapat dibaca.";
    if (err.status === 404) return "Data tidak ditemukan.";
    if (err.status === 429) return "Terlalu banyak permintaan. Mohon tunggu sebentar.";
    if (err.status >= 500) return "Server sedang bermasalah. Coba lagi nanti.";
    return err.message;
  }
  return "Terjadi kesalahan tak terduga.";
}
