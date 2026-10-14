// Utilitas keamanan sisi klien.  Uji dengan:  npm test  (tests/aman.test.mjs)

// TODO: kembalikan `next` HANYA bila berupa path internal yang aman; selain itu kembalikan `cadangan`.
//   Tolak (kembalikan cadangan) bila:
//   - bukan string
//   - tidak diawali "/"
//   - diawali "//" (URL relatif-protokol ke host lain) atau "/\"
//   - mengandung backslash atau karakter kontrol (\u0000-\u001f, \u007f)
//   Contoh: "/admin/produk" -> sama ; "//evil.com" -> "/" ; "https://evil.com" -> "/"
export function pathInternal(next, cadangan = "/") {
  return cadangan;
}
