// Praktikum Pertemuan 3 - Latihan Array & Object
// Jalankan: node latihan-array.js
// Selesaikan setiap fungsi. Pengecekan otomatis ada di bagian bawah.

const produk = [
  { id: 1, nama: "Kopi Gayo 250g",    harga: 65000, kategori: "kopi", stok: 12 },
  { id: 2, nama: "Kopi Toraja 250g",  harga: 72000, kategori: "kopi", stok: 0 },
  { id: 3, nama: "Teh Melati 100g",   harga: 30000, kategori: "teh",  stok: 25 },
  { id: 4, nama: "Teh Hijau 100g",    harga: 28000, kategori: "teh",  stok: 8 },
  { id: 5, nama: "Gula Aren 500g",    harga: 22000, kategori: "gula", stok: 40 },
  { id: 6, nama: "Cangkir Keramik",   harga: 45000, kategori: "alat", stok: 5 },
];

// 1. Kembalikan array berisi nama produk saja (map).
function daftarNama(data) {
  return data.map(p => p.nama);
}

// 2. Kembalikan produk yang stoknya > 0 (filter).
function produkTersedia(data) {
  // TODO
  return data.filter(p => p.stok > 0)
}

// 3. Kembalikan total nilai persediaan: jumlah (harga * stok) semua produk (reduce).
function nilaiPersediaan(data) {
  // TODO
  return data.reduce((total, p) => total + p.harga * p.stok, 0);
}

// 4. Kembalikan produk termurah (objek). Jangan mengubah array asli! (salin sebelum sort)
function produkTermurah(data) {
  // TODO
  const dataCopy = [...data];
  return dataCopy.sort((a, b) => a.harga - b.harga)[0];
}

// 5. Kelompokkan produk berdasarkan kategori -> { kopi: [...], teh: [...], ... } (reduce)
function kelompokKategori(data) {
  // TODO
  return data.reduce((acc, p) => {
    if (!acc[p.kategori]) acc[p.kategori] = [];
    acc[p.kategori].push(p);
    return acc;
  }, {});
}

// 6. Cari berdasarkan kata kunci, tidak peka huruf besar-kecil, hanya pada nama.
//    Kembalikan array hasil. Kata kunci kosong -> kembalikan semua.
function cariProduk(data, kata) {
  // TODO
}

// ====================== PENGECEKAN (jangan diubah) ======================
const asal = JSON.stringify(produk);
const hasil = [];
const cek = (nama, kondisi) => hasil.push({ nama, lulus: Boolean(kondisi) });
const aman = (fn) => { try { return fn(); } catch { return undefined; } };

cek("1. daftarNama", JSON.stringify(aman(() => daftarNama(produk))) ===
  JSON.stringify(["Kopi Gayo 250g", "Kopi Toraja 250g", "Teh Melati 100g", "Teh Hijau 100g", "Gula Aren 500g", "Cangkir Keramik"]));

cek("2. produkTersedia", aman(() => produkTersedia(produk).map((p) => p.id).join(",")) === "1,3,4,5,6");

cek("3. nilaiPersediaan", aman(() => nilaiPersediaan(produk)) === 65000 * 12 + 30000 * 25 + 28000 * 8 + 22000 * 40 + 45000 * 5);

cek("4. produkTermurah (+ tidak memutasi)", aman(() => produkTermurah(produk).id) === 5 && JSON.stringify(produk) === asal);

const g = aman(() => kelompokKategori(produk));
cek("5. kelompokKategori", g && g.kopi?.length === 2 && g.teh?.length === 2 && g.gula?.length === 1 && g.alat?.length === 1);

cek("6a. cariProduk('GAYO')", aman(() => cariProduk(produk, "GAYO").map((p) => p.id).join(",")) === "1");
cek("6b. cariProduk('teh')", aman(() => cariProduk(produk, "teh").length) === 2);
cek("6c. cariProduk('') semua", aman(() => cariProduk(produk, "").length) === 6);

for (const h of hasil) console.log(`${h.lulus ? "LULUS" : "GAGAL"}  ${h.nama}`);
const total = hasil.filter((h) => h.lulus).length;
console.log(`\nSkor: ${total}/${hasil.length}`);
process.exitCode = total === hasil.length ? 0 : 1;
