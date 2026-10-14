// Praktikum Pertemuan 4 - Katalog berbasis Fetch
// Jalankan:
//   terminal 1:  node mock-api.js      (API di :4000)
//   terminal 2:  npx serve .           (halaman, catat portnya; mis. :3000)
// Aturan: tanpa innerHTML untuk data dinamis.

import { ambilDenganCobaUlang, pesanUntukPengguna } from "./api.js";

// ---------- Elemen ----------
const daftarProduk = document.querySelector("#daftar-produk");
const inputCari = document.querySelector("#cari");
const pilihKategori = document.querySelector("#kategori");
const pesan = document.querySelector("#pesan");
const tombolCoba = document.querySelector("#coba-lagi");

// ---------- State ----------
const ui = {
  status: "idle",       // idle | loading | success | empty | error
  data: [],
  error: "",
  kata: "",
  kategori: "semua",
};

let pengendali = null;  // AbortController untuk request yang sedang berjalan

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// ---------- Pemuatan data ----------
// TODO 3: implementasikan muat()
//   1. batalkan request sebelumnya (pengendali?.abort()), buat AbortController baru
//   2. ui.status = "loading"; render()
//   3. bangun query dengan URLSearchParams (kategori jika bukan "semua", q jika tidak kosong)
//   4. data = await ambilDenganCobaUlang(`/api/produk?${query}`, { signal })
//   5. validasi: harus array; ui.status = data.length ? "success" : "empty"
//   6. catch: abaikan AbortError (return); selain itu ui.status = "error", ui.error = pesanUntukPengguna(err)
//   7. render()
async function muat() {
  // ...
}

// ---------- Render ----------
function buatKartu(p) {
  const el = document.createElement("article");
  el.className = "kartu";

  const h2 = document.createElement("h2");
  h2.textContent = p.nama;

  const kat = document.createElement("p");
  kat.className = "kategori";
  kat.textContent = p.kategori;

  const harga = document.createElement("p");
  harga.className = "harga";
  harga.textContent = formatRupiah(p.harga);

  const stok = document.createElement("p");
  stok.textContent = p.stok > 0 ? `Stok: ${p.stok}` : "Habis";

  el.append(h2, kat, harga, stok);
  return el;
}

// TODO 4: render() berdasarkan ui.status
//   loading : pesan "Memuat produk…", daftarProduk.setAttribute("aria-busy","true")
//   error   : pesan = ui.error, tampilkan tombolCoba
//   empty   : pesan "Produk tidak ditemukan."
//   success : sembunyikan pesan, daftarProduk.replaceChildren(...ui.data.map(buatKartu))
function render() {
  // ...
}

// ---------- Event ----------
// TODO 5: debounce(fn, ms) lalu pasang pada inputCari ('input') -> ui.kata = ...; muat()
function debounce(fn, ms = 300) {
  // ...
}

// TODO 6: pasang 'change' pada pilihKategori -> ui.kategori = ...; muat()
// TODO 7: pasang 'click' pada tombolCoba -> muat()

// ---------- Mulai ----------
muat();
