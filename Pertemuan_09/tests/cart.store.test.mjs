// Uji logika store keranjang tanpa browser.  Jalankan: npm test
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createPinia, setActivePinia } from "pinia";

import { useCartStore, KUNCI_STORAGE } from "../src/stores/cart.js";

// ----- storage palsu -----
function buatStorage(awal = {}) {
  const data = new Map(Object.entries(awal));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    _data: data,
  };
}

function pasangStorage(storage) {
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });
}

const kopi = { id: 1, nama: "Kopi Gayo 250g", harga: 65000, stok: 3 };
const teh = { id: 4, nama: "Teh Melati 100g", harga: 30000, stok: 25 };
const habis = { id: 2, nama: "Kopi Toraja 250g", harga: 72000, stok: 0 };

let storage;
beforeEach(() => {
  storage = buatStorage();
  pasangStorage(storage);
  setActivePinia(createPinia());
});

test("keranjang awal kosong", () => {
  const c = useCartStore();
  assert.equal(c.jumlahItem, 0);
  assert.equal(c.total, 0);
  assert.deepEqual(c.itemUntukServer, []);
});

test("tambah produk: jumlah dan total benar", () => {
  const c = useCartStore();
  assert.equal(c.tambah(kopi), true);
  assert.equal(c.jumlahItem, 1);
  assert.equal(c.total, 65000);
});

test("tambah berulang dan beberapa produk", () => {
  const c = useCartStore();
  c.tambah(kopi);
  c.tambah(kopi);
  c.tambah(teh, 3);
  assert.equal(c.jumlahItem, 5);
  assert.equal(c.total, 2 * 65000 + 3 * 30000);
});

test("tidak boleh melebihi stok", () => {
  const c = useCartStore();
  assert.equal(c.tambah(kopi, 5), true); // dibatasi ke stok 3
  assert.equal(c.jumlahItem, 3);
  assert.equal(c.tambah(kopi), false); // sudah penuh
  assert.equal(c.jumlahItem, 3);
});

test("produk stok 0 tidak dapat ditambahkan", () => {
  const c = useCartStore();
  assert.equal(c.tambah(habis), false);
  assert.equal(c.jumlahItem, 0);
});

test("ubahJumlah: set, batasi stok, dan 0 menghapus", () => {
  const c = useCartStore();
  c.tambah(kopi);
  c.ubahJumlah(1, 2);
  assert.equal(c.jumlahItem, 2);
  c.ubahJumlah(1, 99);
  assert.equal(c.jumlahItem, 3);
  c.ubahJumlah(1, 0);
  assert.equal(c.jumlahItem, 0);
  assert.equal(Object.keys(c.items).length, 0);
});

test("hapus dan kosongkan", () => {
  const c = useCartStore();
  c.tambah(kopi);
  c.tambah(teh);
  c.hapus(1);
  assert.deepEqual(Object.keys(c.items), ["4"]);
  c.kosongkan();
  assert.equal(c.jumlahItem, 0);
});

test("itemUntukServer hanya produkId dan jumlah", () => {
  const c = useCartStore();
  c.tambah(kopi, 2);
  c.tambah(teh);
  const hasil = [...c.itemUntukServer].sort((a, b) => a.produkId - b.produkId);
  assert.deepEqual(hasil, [
    { produkId: 1, jumlah: 2 },
    { produkId: 4, jumlah: 1 },
  ]);
});

test("persistensi: tersimpan dan dipulihkan pada store baru", () => {
  const c1 = useCartStore();
  c1.tambah(kopi, 2);
  assert.ok(storage.getItem(KUNCI_STORAGE), "harus menulis ke storage");

  setActivePinia(createPinia()); // simulasi muat ulang halaman
  const c2 = useCartStore();
  assert.equal(c2.jumlahItem, 2);
  assert.equal(c2.total, 130000);
});

test("data storage rusak tidak merusak aplikasi", () => {
  pasangStorage(buatStorage({ [KUNCI_STORAGE]: "{bukan json" }));
  setActivePinia(createPinia());
  const c = useCartStore();
  assert.equal(c.jumlahItem, 0);
});

test("data storage dengan bentuk salah ditolak", () => {
  const jahat = JSON.stringify({ 1: { produk: { id: 1, nama: "X", harga: "gratis", stok: 1 }, jumlah: -5 } });
  pasangStorage(buatStorage({ [KUNCI_STORAGE]: jahat }));
  setActivePinia(createPinia());
  const c = useCartStore();
  assert.equal(c.jumlahItem, 0);
});

test("storage tidak tersedia: aplikasi tetap bekerja", () => {
  pasangStorage(null);
  setActivePinia(createPinia());
  const c = useCartStore();
  assert.equal(c.tambah(teh), true);
  assert.equal(c.jumlahItem, 1);
});
