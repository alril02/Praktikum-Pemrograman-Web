// Uji pencegahan open redirect.  Jalankan: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathInternal } from "../src/lib/aman.js";

test("path internal yang aman diteruskan", () => {
  assert.equal(pathInternal("/admin/produk"), "/admin/produk");
  assert.equal(pathInternal("/keranjang?info=kosong"), "/keranjang?info=kosong");
  assert.equal(pathInternal("/"), "/");
});

test("URL absolut ditolak", () => {
  assert.equal(pathInternal("https://situs-jahat.example"), "/");
  assert.equal(pathInternal("http://situs-jahat.example/login"), "/");
  assert.equal(pathInternal("javascript:alert(1)"), "/");
});

test("URL relatif-protokol dan trik backslash ditolak", () => {
  assert.equal(pathInternal("//situs-jahat.example"), "/");
  assert.equal(pathInternal("/\\situs-jahat.example"), "/");
  assert.equal(pathInternal("/\\/situs-jahat.example"), "/");
});

test("karakter kontrol ditolak", () => {
  assert.equal(pathInternal("/admin\r\nLocation: https://x"), "/");
  assert.equal(pathInternal("/a\u0000b"), "/");
});

test("bukan string / kosong -> cadangan", () => {
  assert.equal(pathInternal(undefined), "/");
  assert.equal(pathInternal(null), "/");
  assert.equal(pathInternal(["/a", "/b"]), "/");
  assert.equal(pathInternal(""), "/");
});

test("cadangan kustom dipakai", () => {
  assert.equal(pathInternal("https://x.y", "/katalog"), "/katalog");
});
