// Praktikum Pertemuan 2 - Pemanasan JavaScript (15 menit)
// Jalankan: node warmup.js
// Selesaikan setiap TODO. Setiap latihan punya pengecekan otomatis di bagian bawah.

// ---------- Latihan 1: variabel dan tipe data ----------
// TODO 1: deklarasikan konstanta `namaToko` (string) dan variabel `jumlahPesanan` (number, awal 0)
//         lalu tambahkan 3 ke jumlahPesanan.
// const namaToko = ...
// let jumlahPesanan = ...

// ---------- Latihan 2: fungsi ----------
// TODO 2: tulis fungsi hitungTotal(harga, jumlah) yang mengembalikan harga * jumlah.
function hitungTotal(harga, jumlah) {
  // ...
}

// ---------- Latihan 3: format rupiah ----------
// TODO 3: tulis fungsi panah formatRupiah(angka) -> "Rp 135.000"
//         petunjuk: angka.toLocaleString("id-ID")
const formatRupiah = (angka) => {
  // ...
};

// ---------- Latihan 4: kondisi ----------
// TODO 4: tulis fungsi kategoriOngkir(berat) dengan aturan:
//         berat <= 1  -> "Reguler"
//         berat <= 5  -> "Berat"
//         selain itu  -> "Kargo"
function kategoriOngkir(berat) {
  // ...
}

// ---------- Latihan 5: perbandingan ketat ----------
// TODO 5: lengkapi fungsi samaPersis(a, b) yang hanya true jika nilai DAN tipenya sama.
function samaPersis(a, b) {
  // ...
}

// ====================== PENGECEKAN (jangan diubah) ======================
const hasil = [];
function cek(nama, kondisi) {
  hasil.push({ nama, lulus: Boolean(kondisi) });
}

try {
  cek("Latihan 1: namaToko string", typeof namaToko === "string");
  cek("Latihan 1: jumlahPesanan === 3", typeof jumlahPesanan !== "undefined" && jumlahPesanan === 3);
} catch {
  cek("Latihan 1: variabel dideklarasikan", false);
}

cek("Latihan 2: hitungTotal(45000, 3) === 135000", hitungTotal(45000, 3) === 135000);
cek("Latihan 3: formatRupiah(135000) === 'Rp 135.000'", String(formatRupiah(135000)).replace(/ /g, " ") === "Rp 135.000");
cek("Latihan 4: kategoriOngkir(0.5) === 'Reguler'", kategoriOngkir(0.5) === "Reguler");
cek("Latihan 4: kategoriOngkir(3) === 'Berat'", kategoriOngkir(3) === "Berat");
cek("Latihan 4: kategoriOngkir(10) === 'Kargo'", kategoriOngkir(10) === "Kargo");
cek("Latihan 5: samaPersis(5, '5') === false", samaPersis(5, "5") === false);
cek("Latihan 5: samaPersis(5, 5) === true", samaPersis(5, 5) === true);

for (const h of hasil) {
  console.log(`${h.lulus ? "LULUS" : "GAGAL"}  ${h.nama}`);
}
const total = hasil.filter((h) => h.lulus).length;
console.log(`\nSkor: ${total}/${hasil.length}`);
process.exitCode = total === hasil.length ? 0 : 1;
