// Validasi sisi klien yang SELARAS dengan aturan server (UX; server tetap otoritatif).
// Uji dengan:  npm test  (tests/validasi.test.mjs)
export const KATEGORI = ["kopi", "teh", "gula", "alat"];

// TODO: validasiProduk(form) -> { valid: boolean, galat: { [field]: pesan }, data }
//   form: { nama, harga, stok, kategori, deskripsi }  (harga/stok dapat berupa string dari <input>)
//
//   nama      : trim; < 3 -> "Nama minimal 3 karakter"; > 100 -> "Nama maksimal 100 karakter"
//   harga     : kosong        -> "Harga wajib diisi"
//               bukan angka   -> "Harga harus berupa angka"     (string harus cocok /^-?\d+(\.\d+)?$/; "1e3" ditolak)
//               desimal       -> "Harga harus bilangan bulat"
//               negatif       -> "Harga tidak boleh negatif"
//   stok      : aturan sama dengan harga (label "Stok")
//   kategori  : harus ada di KATEGORI -> selain itu "Pilih kategori yang tersedia"
//   deskripsi : trim; > 500 -> "Deskripsi maksimal 500 karakter"; kosong -> data.deskripsi = null
//
//   data berisi nilai yang sudah dikonversi (harga/stok = number, nama = trim) hanya untuk field yang valid.
export function validasiProduk(form) {
  return { valid: false, galat: {}, data: {} };
}
