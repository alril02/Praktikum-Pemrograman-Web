// Uji deteksi tipe gambar dari magic bytes.  Jalankan: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { deteksiGambar } from "../src/utils/deteksiGambar.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0x24, 0, 0, 0]), Buffer.from("WEBPVP8 ")]);

test("PNG dikenali", () => {
  assert.deepEqual(deteksiGambar(PNG), { mime: "image/png", ext: "png" });
});

test("JPEG dikenali", () => {
  assert.deepEqual(deteksiGambar(JPEG), { mime: "image/jpeg", ext: "jpg" });
});

test("WebP dikenali", () => {
  assert.deepEqual(deteksiGambar(WEBP), { mime: "image/webp", ext: "webp" });
});

test("teks biasa ditolak walau berekstensi gambar", () => {
  assert.equal(deteksiGambar(Buffer.from("ini bukan gambar sama sekali, hanya teks")), null);
});

test("HTML/skrip ditolak", () => {
  assert.equal(deteksiGambar(Buffer.from("<script>alert(1)</script>")), null);
});

test("SVG ditolak", () => {
  assert.equal(deteksiGambar(Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>')), null);
});

test("PDF dan ZIP ditolak", () => {
  assert.equal(deteksiGambar(Buffer.from("%PDF-1.7 ...")), null);
  assert.equal(deteksiGambar(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0])), null);
});

test("buffer kosong/terlalu pendek tidak melempar galat", () => {
  assert.equal(deteksiGambar(Buffer.alloc(0)), null);
  assert.equal(deteksiGambar(Buffer.from([0xff])), null);
  assert.equal(deteksiGambar(Buffer.from("RIFF")), null);
});

test("RIFF yang bukan WebP ditolak (mis. WAV)", () => {
  const wav = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0x24, 0, 0, 0]), Buffer.from("WAVEfmt ")]);
  assert.equal(deteksiGambar(wav), null);
});
