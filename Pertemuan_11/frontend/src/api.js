// Lapisan akses jaringan TUNGGAL untuk seluruh aplikasi.
// Uji dengan:  npm test   (tests/api.test.mjs)
const BASE = import.meta.env?.VITE_API_BASE ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  constructor(pesan, { status = 0, kode = "", detail = null, jenis = "http", retryAfter = null } = {}) {
    super(pesan);
    this.name = "ApiError";
    this.status = status;
    this.kode = kode;
    this.detail = detail; // [{ field, pesan }] pada 422
    this.jenis = jenis; // "jaringan" | "http"
    this.retryAfter = retryAfter; // detik (header Retry-After) atau null
  }

  // TODO 1: ubah `detail` [{ field, pesan }] menjadi object { [field]: pesan }.
  //   detail kosong/null -> {}.   Contoh: [{field:"harga",pesan:"x"}] -> { harga: "x" }
  get galatField() {
    return {};
  }
}

// ---- Sambungan ke sesi (diisi oleh main.js) ----
let ambilToken = () => null;
let saatTidakSah = () => {};

export function pasangAuth({ token, onTidakSah }) {
  ambilToken = token ?? (() => null);
  saatTidakSah = onTidakSah ?? (() => {});
}

// URL penuh untuk aset yang disajikan server (mis. gambar produk "/uploads/x.png")
export function urlAset(path) {
  if (!path) return "";
  return new URL(BASE).origin + path;
}

async function minta(path, { method = "GET", body, signal, tanpaAuth = false } = {}) {
  const headers = { Accept: "application/json" };

  // TODO 2 (interceptor REQUEST):
  //   - token = tanpaAuth ? null : ambilToken(); bila ada -> headers.Authorization = `Bearer ${token}`
  //   - body instanceof FormData  -> kirim apa adanya, JANGAN set Content-Type (boundary dari browser)
  //   - body lain (!== undefined) -> Content-Type: application/json + JSON.stringify(body)
  const token = null;
  const payload = undefined;

  let r;
  try {
    r = await fetch(BASE + path, { method, headers, body: payload, signal });
  } catch (e) {
    if (e?.name === "AbortError") throw e; // dibatalkan pemanggil
    throw new ApiError("Tidak dapat terhubung ke server", { jenis: "jaringan" });
  }

  let data = null;
  if (r.status !== 204) {
    try {
      data = await r.json();
    } catch {
      /* body kosong / bukan JSON */
    }
  }

  // TODO 3 (interceptor RESPONS 401, single-flight):
  //   bila r.status === 401 DAN request ini membawa token DAN ambilToken() masih sama dengan token itu
  //   -> panggil saatTidakSah() SATU kali (setelah handler mengosongkan token, 401 lain diabaikan).
  void [token, saatTidakSah];

  if (!r.ok) {
    const e = data?.error;
    throw new ApiError(e?.pesan ?? `Permintaan gagal (${r.status})`, {
      status: r.status,
      kode: e?.kode ?? "",
      detail: e?.detail ?? null,
      retryAfter: Number(r.headers.get("Retry-After")) || null,
    });
  }
  return data;
}

export const api = {
  get: (path, opsi) => minta(path, { ...opsi, method: "GET" }),
  post: (path, body, opsi) => minta(path, { ...opsi, method: "POST", body }),
  put: (path, body, opsi) => minta(path, { ...opsi, method: "PUT", body }),
  patch: (path, body, opsi) => minta(path, { ...opsi, method: "PATCH", body }),
  delete: (path, opsi) => minta(path, { ...opsi, method: "DELETE" }),
};

export function pesanGalat(err) {
  if (err instanceof ApiError) {
    if (err.jenis === "jaringan") return "Tidak dapat terhubung ke server. Periksa koneksi Anda.";
    if (err.status === 401) return "Sesi Anda berakhir. Silakan masuk kembali.";
    if (err.status === 403) return "Anda tidak memiliki hak untuk tindakan ini.";
    if (err.status === 404) return "Data tidak ditemukan.";
    if (err.status === 409) return err.message;
    if (err.status === 413) return "Ukuran berkas terlalu besar.";
    if (err.status === 415) return err.message;
    if (err.status === 429) {
      return err.retryAfter
        ? `Terlalu banyak percobaan. Coba lagi dalam ${err.retryAfter} detik.`
        : "Terlalu banyak percobaan. Coba lagi nanti.";
    }
    if (err.status >= 500) return "Server sedang bermasalah. Coba lagi nanti.";
    return err.message;
  }
  return "Terjadi kesalahan tak terduga.";
}
