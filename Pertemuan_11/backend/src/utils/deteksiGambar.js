// Mengenali tipe gambar dari ISI berkas (magic bytes), BUKAN dari nama/mimetype klien.
// Mengembalikan { mime, ext } atau null bila bukan JPEG/PNG/WebP.
//
// Signature:
//   JPEG : FF D8 FF
//   PNG  : 89 50 4E 47 0D 0A 1A 0A
//   WebP : "RIFF" .... "WEBP"   (byte 0-3 dan 8-11)
//
// TODO: implementasikan. Parameter `buf` adalah Buffer.
export function deteksiGambar(buf) {
  return null;
}
