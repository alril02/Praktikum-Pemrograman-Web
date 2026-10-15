// Praktikum Pertemuan 3 - Katalog Produk Interaktif
// Aturan: DILARANG memakai innerHTML untuk data dinamis.
// Jalankan lewat server statis karena memakai ES Module:  npx serve .

import { produk } from "./products.js";

// ---------- Elemen ----------
const daftarProduk = document.querySelector("#daftar-produk");
const inputCari = document.querySelector("#cari");
const pilihKategori = document.querySelector("#kategori");
const info = document.querySelector("#info");
const jumlahItem = document.querySelector("#jumlah-item");
const totalHarga = document.querySelector("#total-harga");

// ---------- State (satu-satunya sumber kebenaran) ----------
const state = {
  produk,
  kategori: "semua",
  kata: "",
  keranjang: new Map(), // id produk -> jumlah
};

const tombol = document.querySelector("button");
const cari = document.getElementById("cari");

tombol.addEventListener("focus", (event) => {
  console.log("Cursor berada di atas tombol");
});


// ---------- Utilitas ----------
const formatRupiah = (angka) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

// ---------- Logika murni ----------
// TODO 1: kembalikan produk yang cocok dengan state.kategori dan state.kata.
//   - kategori "semua" = tanpa filter kategori
//   - kata tidak peka huruf besar-kecil, hanya cocokkan nama, abaikan spasi tepi
function produkTerfilter() {
  return state.produk; // ganti dengan implementasi Anda
}

// TODO 2: kembalikan { jumlah, total } dari state.keranjang
//   jumlah = total qty seluruh item; total = jumlah (harga * qty)
function ringkasanKeranjang() {
  return { jumlah: 0, total: 0 };
}

// ---------- Pembuat elemen ----------
// TODO 3: bangun satu kartu produk dengan createElement + textContent.
//   Struktur: <article class="kartu">
//               <h2>nama</h2>
//               <p class="kategori">kategori</p>
//               <p class="harga">Rp ...</p>
//               <p class="stok">Stok: n</p>   (atau "Habis" bila 0)
//               <button type="button" data-aksi="tambah" data-id="...">Tambah ke keranjang</button>
//             </article>
//   Tombol harus disabled bila stok 0.
function buatKartu(p) {
  const el = document.createElement("article");
  el.className = "kartu";
  // ...
  return el;
}

// ---------- Render ----------
// TODO 4: render hasil filter dengan replaceChildren(...)
//   - tampilkan teks pada #info, mis. "5 produk ditampilkan" atau "Produk tidak ditemukan"
//   - perbarui ringkasan keranjang di header
function render() {
  const hasil = produkTerfilter();
  // ...
}

// ---------- Inisialisasi pilihan kategori ----------
// TODO 5: isi <select> dengan kategori unik dari state.produk (gunakan Set), tanpa innerHTML
function isiPilihanKategori() {
  // ...
}

// ---------- Event ----------
// TODO 6: pasang event 'input' (pencarian) dan 'change' (kategori), ubah state lalu render()

// TODO 7: EVENT DELEGATION. Satu listener 'click' pada daftarProduk.
//   Gunakan event.target.closest("button[data-aksi='tambah']").
//   Tambah qty di state.keranjang (jangan melebihi stok), lalu render().

// ---------- Mulai ----------
isiPilihanKategori();
render();
