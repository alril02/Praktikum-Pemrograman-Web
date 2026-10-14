// Lapisan akses jaringan tunggal untuk SPA.
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  constructor(pesan, { status = 0, kode = "", detail = null, jenis = "http" } = {}) {
    super(pesan);
    this.name = "ApiError";
    this.status = status;
    this.kode = kode;
    this.detail = detail;
    this.jenis = jenis; // "jaringan" | "http"
  }
}

async function minta(path, { method = "GET", body, signal } = {}) {
  let respons;
  try {
    respons = await fetch(BASE + path, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === "AbortError") throw e; // dibatalkan oleh pemanggil, bukan galat jaringan
    throw new ApiError("Tidak dapat terhubung ke server", { jenis: "jaringan" });
  }

  if (respons.status === 204) return null;

  let json = null;
  try { json = await respons.json(); } catch { /* body kosong / bukan JSON */ }

  if (!respons.ok) {
    const e = json?.error;
    throw new ApiError(e?.pesan ?? `Permintaan gagal (${respons.status})`, {
      status: respons.status,
      kode: e?.kode ?? "",
      detail: e?.detail ?? null,
    });
  }
  return json;
}

export const api = {
  get: (path, opsi) => minta(path, { ...opsi, method: "GET" }),
  post: (path, body, opsi) => minta(path, { ...opsi, method: "POST", body }),
};

export function pesanGalat(err) {
  if (err instanceof ApiError) {
    if (err.jenis === "jaringan") return "Tidak dapat terhubung ke server. Periksa koneksi Anda.";
    if (err.status === 404) return "Data tidak ditemukan.";
    if (err.status >= 500) return "Server sedang bermasalah. Coba lagi nanti.";
    return err.message;
  }
  return "Terjadi kesalahan tak terduga.";
}
