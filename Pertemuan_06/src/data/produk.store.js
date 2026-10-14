// Penyimpanan in-memory SEMENTARA. Pada pertemuan 7 diganti database (Prisma)
// tanpa mengubah controller: pertahankan antarmuka fungsi ini.

let produk = [
  { id: 1, nama: "Kopi Gayo 250g",     harga: 65000,  stok: 12, kategori: "kopi" },
  { id: 2, nama: "Kopi Toraja 250g",   harga: 72000,  stok: 0,  kategori: "kopi" },
  { id: 3, nama: "Kopi Flores Bajawa", harga: 68000,  stok: 9,  kategori: "kopi" },
  { id: 4, nama: "Teh Melati 100g",    harga: 30000,  stok: 25, kategori: "teh" },
  { id: 5, nama: "Teh Hijau 100g",     harga: 28000,  stok: 8,  kategori: "teh" },
  { id: 6, nama: "Teh Hitam Premium",  harga: 35000,  stok: 14, kategori: "teh" },
  { id: 7, nama: "Gula Aren 500g",     harga: 22000,  stok: 40, kategori: "gula" },
  { id: 8, nama: "Gula Kelapa Cair",   harga: 26000,  stok: 18, kategori: "gula" },
  { id: 9, nama: "Cangkir Keramik",    harga: 45000,  stok: 5,  kategori: "alat" },
  { id: 10, nama: "French Press 350ml", harga: 120000, stok: 3, kategori: "alat" },
];

let idBerikut = 11;

export const KATEGORI = ["kopi", "teh", "gula", "alat"];

export const semua = () => [...produk];

export const cariId = (id) => produk.find((p) => p.id === id);

export function tambah(data) {
  const baru = { id: idBerikut++, ...data };
  produk.push(baru);
  return baru;
}

export function ganti(id, data) {
  const i = produk.findIndex((p) => p.id === id);
  if (i === -1) return undefined;
  produk[i] = { id, ...data };
  return produk[i];
}

export function ubah(id, sebagian) {
  const i = produk.findIndex((p) => p.id === id);
  if (i === -1) return undefined;
  produk[i] = { ...produk[i], ...sebagian, id };
  return produk[i];
}

export function hapus(id) {
  const sebelum = produk.length;
  produk = produk.filter((p) => p.id !== id);
  return produk.length < sebelum;
}

// Hanya untuk pengujian: kembalikan data ke kondisi awal
export function reset(awal) {
  produk = awal.map((p) => ({ ...p }));
  idBerikut = Math.max(0, ...produk.map((p) => p.id)) + 1;
}
