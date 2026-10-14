// Uji validasi sisi klien.  Jalankan: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { validasiProduk } from "../src/lib/validasiProduk.js";

const baik = { nama: "Kopi Gayo", harga: "65000", stok: "12", kategori: "kopi", deskripsi: "" };

test("form valid: konversi string -> number dan deskripsi kosong -> null", () => {
  const r = validasiProduk(baik);
  assert.equal(r.valid, true);
  assert.deepEqual(r.galat, {});
  assert.deepEqual(r.data, { nama: "Kopi Gayo", harga: 65000, stok: 12, kategori: "kopi", deskripsi: null });
});

test("nama dipangkas dan diperiksa panjangnya", () => {
  assert.equal(validasiProduk({ ...baik, nama: "  Ko  " }).galat.nama, "Nama minimal 3 karakter");
  assert.equal(validasiProduk({ ...baik, nama: "x".repeat(101) }).galat.nama, "Nama maksimal 100 karakter");
  assert.equal(validasiProduk({ ...baik, nama: "  Teh Melati  " }).data.nama, "Teh Melati");
});

test("harga: kosong, bukan angka, desimal, negatif", () => {
  assert.equal(validasiProduk({ ...baik, harga: "" }).galat.harga, "Harga wajib diisi");
  assert.equal(validasiProduk({ ...baik, harga: "   " }).galat.harga, "Harga wajib diisi");
  assert.equal(validasiProduk({ ...baik, harga: "abc" }).galat.harga, "Harga harus berupa angka");
  assert.equal(validasiProduk({ ...baik, harga: "1e3" }).galat.harga, "Harga harus berupa angka");
  assert.equal(validasiProduk({ ...baik, harga: "12.5" }).galat.harga, "Harga harus bilangan bulat");
  assert.equal(validasiProduk({ ...baik, harga: "-1" }).galat.harga, "Harga tidak boleh negatif");
});

test("stok memakai aturan yang sama dengan label sendiri", () => {
  assert.equal(validasiProduk({ ...baik, stok: "" }).galat.stok, "Stok wajib diisi");
  assert.equal(validasiProduk({ ...baik, stok: "-3" }).galat.stok, "Stok tidak boleh negatif");
  assert.equal(validasiProduk({ ...baik, stok: 7 }).data.stok, 7);
});

test("nol diterima sebagai harga/stok yang valid", () => {
  const r = validasiProduk({ ...baik, harga: "0", stok: 0 });
  assert.equal(r.valid, true);
  assert.equal(r.data.harga, 0);
  assert.equal(r.data.stok, 0);
});

test("kategori harus dari daftar", () => {
  assert.equal(validasiProduk({ ...baik, kategori: "mobil" }).galat.kategori, "Pilih kategori yang tersedia");
});

test("deskripsi: batas 500 dan dipangkas", () => {
  assert.equal(validasiProduk({ ...baik, deskripsi: "x".repeat(501) }).galat.deskripsi, "Deskripsi maksimal 500 karakter");
  assert.equal(validasiProduk({ ...baik, deskripsi: "  Sangrai medium " }).data.deskripsi, "Sangrai medium");
});

test("banyak galat sekaligus dan data hanya berisi field valid", () => {
  const r = validasiProduk({ nama: "K", harga: "-5", stok: "x", kategori: "kopi", deskripsi: "" });
  assert.equal(r.valid, false);
  assert.deepEqual(Object.keys(r.galat).sort(), ["harga", "nama", "stok"]);
  assert.equal(r.data.kategori, "kopi");
  assert.equal("harga" in r.data, false);
});
